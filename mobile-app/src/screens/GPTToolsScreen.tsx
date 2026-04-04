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
import { useDrawer, useCredits } from '../context';

const GPTToolsScreen: React.FC = ({ navigation }: any) => {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const { openDrawer, navigateTo } = useDrawer();
  const { credits } = useCredits();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const catRes = await api.get('/ai/gpt-categories/');
      const toolsRes = await api.get('/ai/gpt-tools/');
      setCategories([{ id: 'all', name: 'All Tools' }, ...catRes.data.results]);
      setTools(toolsRes.data.results);
      setActiveCategory('all');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTools = tools.filter(t => activeCategory === 'all' || t.category === activeCategory);

  const useTool = (tool: any) => {
    // Navigate to Chat screen but with logic? 
    // Wait, the requirement says we can use these tools, typically meaning it presets the chat prompt.
    // We can just navigate to Chat and pass the prompt.
    navigateTo('ChatScreen', { initialPrompt: tool.prompt_template });
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
        <Text style={styles.headerTitle}>GPT Tools</Text>
          <View style={styles.headerButton}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinBadgeText}>{credits?.credits || 0}</Text>
            </View>
          </View>
      </View>

      <View style={styles.categories}>
        
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={[styles.catText, activeCategory === cat.id && styles.catTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredTools.length === 0 ? (
           <Text style={styles.empty}>No tools in this category.</Text>
        ) : (
          filteredTools.map(tool => (
            <GlassCard key={tool.id} style={styles.card}>
               <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{tool.name}</Text>
                  <Text style={styles.cost}>{tool.cost} coins</Text>
               </View>
               <Text style={styles.cardDesc}>{tool.description}</Text>
               <TouchableOpacity style={styles.useBtn} onPress={() => useTool(tool)}>
                  <Text style={styles.useBtnText}>Use Tool</Text>
               </TouchableOpacity>
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
  categories: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm },
  catScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  catBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { color: colors.textSecondary },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  list: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, flex: 1 },
  cost: { fontSize: 12, color: colors.warning, fontWeight: 'bold' },
  cardDesc: { color: colors.textMuted, marginBottom: spacing.md },
  useBtn: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  useBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
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
  coinBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  coinIcon: { fontSize: 12 }
});

export default GPTToolsScreen;
