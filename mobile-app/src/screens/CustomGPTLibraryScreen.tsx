import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import api from '../services/api';
import { useDrawer } from '../context';
import { useIsFocused } from '@react-navigation/native';

const CustomGPTLibraryScreen: React.FC = ({ navigation }: any) => {
  const [gpts, setGpts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openDrawer } = useDrawer();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    try {
      const res = await api.get('/ai/custom-gpts/');
      setGpts(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const useGPT = (gpt: any) => {
    navigation.navigate('Chat', { initialPrompt: gpt.prompt_template });
  };

  const deleteGPT = async (id: number) => {
    try {
       await api.delete(`/ai/custom-gpts/${id}/`);
       fetchData();
    } catch {
       Alert.alert("Error", "Could not delete GPT.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Custom GPTs</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('CustomGPTCreate')}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {gpts.length === 0 ? (
           <Text style={styles.empty}>You haven't created any Custom GPTs yet.</Text>
        ) : (
          gpts.map(gpt => (
            <GlassCard key={gpt.id} style={styles.card}>
               <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{gpt.name}</Text>
                  {gpt.is_public && <Text style={styles.publicTag}>Public</Text>}
               </View>
               <Text style={styles.cardDesc}>{gpt.description}</Text>
               <View style={styles.actions}>
                   <TouchableOpacity style={styles.useBtn} onPress={() => useGPT(gpt)}>
                      <Text style={styles.useBtnText}>Use</Text>
                   </TouchableOpacity>
                   <View style={{flexDirection: 'row', gap: spacing.sm}}>
                       <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CustomGPTCreate', { gpt })}>
                          <Ionicons name="pencil" size={18} color={colors.white} />
                       </TouchableOpacity>
                       <TouchableOpacity style={[styles.iconBtn, {backgroundColor: colors.error}]} onPress={() => {
                           Alert.alert('Delete', 'Are you sure?', [
                               { text: 'Cancel', style: 'cancel' },
                               { text: 'Delete', style: 'destructive', onPress: () => deleteGPT(gpt.id) }
                           ])
                       }}>
                          <Ionicons name="trash" size={18} color={colors.white} />
                       </TouchableOpacity>
                   </View>
               </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  list: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, flex: 1 },
  publicTag: { fontSize: 10, color: colors.primary, borderColor: colors.primary, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  cardDesc: { color: colors.textMuted, marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  useBtn: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  useBtnText: { color: colors.foreground, fontWeight: 'bold' },
  iconBtn: { backgroundColor: colors.card, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }
});

export default CustomGPTLibraryScreen;
