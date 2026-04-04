import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useDrawer, useCredits, useAuth } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService, getErrorMessage } from '../services';
import { WS_BASE_URL, STORAGE_KEYS } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TextRemoverScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { credits, hasEnoughCredits, refreshCredits } = useCredits();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchModel();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const fetchModel = async () => {
    try {
      const response = await chatService.getModels('image_tool');
      const textRemoverModel = response.results.find(
        (m: any) => m.model_id === 'wavespeed-ai/image-text-remover'
      );
      if (textRemoverModel) {
        setModel(textRemoverModel);
      }
    } catch (err) {
      console.error('Failed to fetch model:', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setResultImage(null);
    }
  };

  const connectWebSocket = async (sessionId: number): Promise<WebSocket> => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) throw new Error('Not authenticated.');

    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}/?token=${token}`;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      wsRef.current = ws;
    });
  };

  const processImage = async () => {
    if (!selectedImage) return;

    if (!model) {
       Alert.alert('Error', 'Model not loaded. Please try again later.');
       return;
    }

    const cost = model.base_cost || 20;
    if (!hasEnoughCredits(cost)) {
      Alert.alert('Insufficient Credits', `You need ${cost} credits to use this tool.`);
      return;
    }

    setIsProcessing(true);
    try {
       const base64 = await FileSystem.readAsStringAsync(selectedImage, { encoding: 'base64' });
       const imageUri = `data:image/jpeg;base64,${base64}`;

       const session = await chatService.createSession(model.id, 'image_tool');
       const ws = await connectWebSocket(session.id);

       ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message' && data.message && Array.isArray(data.message.images)) {
                if (data.message.images.length > 0) {
                    setResultImage(data.message.images[0]);
                    refreshCredits();
                }
                setIsProcessing(false);
                ws.close();
            } else if (data.type === 'error') {
                Alert.alert('Error', data.message || 'Processing failed');
                setIsProcessing(false);
                ws.close();
            }
          } catch(e) {}
       };

       ws.send(JSON.stringify({
           message: "Remove text",
           images: [imageUri],
       }));

    } catch (err) {
       Alert.alert('Error', getErrorMessage(err));
       setIsProcessing(false);
    }
  };

  const downloadResult = async () => {
    if (resultImage) {
        const result = await mediaService.saveImageToGallery(resultImage);
        if (result.success) Alert.alert('Success', 'Image downloaded!');
        else Alert.alert('Error', 'Failed to download image.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text Remover</Text>
        <View style={styles.headerButton}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>??</Text>
              <Text style={styles.coinBadgeText}>{credits?.credits || 0}</Text>
          
      </View>
      </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
         <GlassCard style={styles.card}>
            <Text style={styles.title}>Remove Text from Image</Text>
            <Text style={styles.desc}>Easily remove unwanted text from your photos using AI.</Text>
            
            <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>
               {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
               ) : (
                  <View style={styles.placeholder}>
                     <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                     <Text style={styles.placeholderText}>Tap to select an image</Text>
                  </View>
               )}
            </TouchableOpacity>

            {selectedImage && !resultImage && (
                <GradientButton
                    title={isProcessing ? "Processing..." : `Remove Text (${model?.base_cost || 20} credits)`}
                    onPress={processImage}
                    disabled={isProcessing}
                    style={{ marginTop: spacing.lg }}
                    icon={isProcessing ? <ActivityIndicator color="#fff" /> : <Ionicons name="color-wand" size={20} color="#fff" />}
                />
            )}

            {resultImage && (
                <View style={styles.resultContainer}>
                     <Text style={styles.resultTitle}>Result</Text>
                     <Image source={{ uri: resultImage }} style={styles.previewImage} />
                     <GradientButton
                         title="Download"
                         onPress={downloadResult}
                         style={{ marginTop: spacing.md }}
                         icon={<Ionicons name="download-outline" size={20} color="#fff" />}
                     />
                </View>
            )}
         </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  scrollContent: { padding: spacing.lg },
  card: { padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  imageSelector: {
      width: '100%', aspectRatio: 1, borderRadius: borderRadius.lg,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'solid',
      overflow: 'hidden', backgroundColor: '#1a1a1a'
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: colors.textMuted, marginTop: spacing.md },
  resultContainer: { width: '100%', marginTop: spacing.xl },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  downloadBtn: { flexDirection: 'row', backgroundColor: colors.success, padding: spacing.md, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: spacing.md },

  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  coinBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
    coinIcon: { fontSize: 12 },
});

export default TextRemoverScreen;
