import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCredits } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import api from '../services/api';

const CustomGPTCreateScreen: React.FC = ({ route, navigation }: any) => {
  const { gpt } = route.params || {};
  const isEditing = !!gpt;
  const insets = useSafeAreaInsets();
  const { credits } = useCredits();

  const [name, setName] = useState(gpt?.name || '');
  const [description, setDescription] = useState(gpt?.description || '');
  const [promptTemplate, setPromptTemplate] = useState(gpt?.prompt_template || '');
  const [isPublic, setIsPublic] = useState(gpt?.is_public || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !promptTemplate.trim()) {
      Alert.alert('Error', 'Name and System Prompt are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name,
        description,
        prompt_template: promptTemplate,
        is_public: isPublic
      };

      if (isEditing) {
        await api.patch(`/ai/custom-gpts/${gpt.id}/`, data);
        Alert.alert('Success', 'Custom GPT updated!');
      } else {
        await api.post('/ai/custom-gpts/', data);
        Alert.alert('Success', 'Custom GPT created!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save Custom GPT.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Custom GPT' : 'Create Custom GPT'}</Text>
        <View style={styles.headerButton}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>{"\uD83E\uDE99"}</Text>
              <Text style={styles.coinBadgeText}>{credits?.credits || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         <GlassCard style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <TextInput
               style={styles.input}
               placeholder="e.g. Code Reviewer"
               placeholderTextColor={colors.textMuted}
               value={name}
               onChangeText={setName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
               style={styles.input}
               placeholder="What does it do?"
               placeholderTextColor={colors.textMuted}
               value={description}
               onChangeText={setDescription}
            />

            <Text style={styles.label}>System Prompt (Instructions)</Text>
            <TextInput
               style={[styles.input, styles.textArea]}
               placeholder="Detailed instructions for the AI on how to act, what to reply, etc."
               placeholderTextColor={colors.textMuted}
               value={promptTemplate}
               onChangeText={setPromptTemplate}
               multiline
            />

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Make Public</Text>
                <Switch
                   value={isPublic}
                   onValueChange={setIsPublic}
                   trackColor={{ false: colors.border, true: colors.primary }}
                   thumbColor={colors.foreground}
                />
            </View>

            <GradientButton
                title={isSubmitting ? "Saving..." : (isEditing ? "Save Changes" : "Create GPT")}
                onPress={handleSave}
                disabled={isSubmitting || !name.trim() || !promptTemplate.trim()}
                style={{ marginTop: spacing.xl }}
            />
         </GlassCard>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },    coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
    coinBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  coinIcon: { fontSize: 12 },  scrollContent: { padding: spacing.lg },
  card: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
      backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
      borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  switchLabel: { fontSize: 16, color: colors.textPrimary }
});

export default CustomGPTCreateScreen;
