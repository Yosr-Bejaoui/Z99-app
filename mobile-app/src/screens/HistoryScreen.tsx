import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { HistoryEmptyState } from '../components/EmptyState';

interface HistoryItem {
  id: string;
  type: 'chat' | 'image';
  title: string;
  model: string;
  date: string;
  words: number;
}

const historyItems: HistoryItem[] = [
  { id: '1', type: 'chat', title: 'Quantum Computing Explained', model: 'ChatGPT', date: '2 hours ago', words: 247 },
  { id: '2', type: 'image', title: 'Cyberpunk City at Sunset', model: 'DALL·E', date: '5 hours ago', words: 12 },
  { id: '3', type: 'chat', title: 'Python Best Practices', model: 'Claude', date: '1 day ago', words: 892 },
  { id: '4', type: 'chat', title: 'React Architecture Guide', model: 'Gemini', date: '2 days ago', words: 1540 },
  { id: '5', type: 'image', title: 'Mountain Watercolor Painting', model: 'Stable Diffusion', date: '3 days ago', words: 8 },
  { id: '6', type: 'chat', title: 'Machine Learning Basics', model: 'DeepSeek', date: '4 days ago', words: 634 },
  { id: '7', type: 'image', title: 'Futuristic Car Design', model: 'Leonardo', date: '5 days ago', words: 15 },
  { id: '8', type: 'chat', title: 'API Design Principles', model: 'ChatGPT', date: '1 week ago', words: 1123 },
];

type FilterType = 'all' | 'chat' | 'image';

const HistoryScreen: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call - replace with actual data fetching
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const filteredItems = historyItems.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getIcon = (type: 'chat' | 'image') => {
    return type === 'chat' ? 'chatbubble-outline' : 'image-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your recent conversations and generations</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'chat' && styles.filterTabActive]}
          onPress={() => setFilter('chat')}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={filter === 'chat' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.filterText, filter === 'chat' && styles.filterTextActive]}>
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'image' && styles.filterTabActive]}
          onPress={() => setFilter('image')}
        >
          <Ionicons
            name="image-outline"
            size={16}
            color={filter === 'image' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.filterText, filter === 'image' && styles.filterTextActive]}>
            Images
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {filteredItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyItem}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIcon(item.type)}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemMeta}>
                {item.model} · {item.words} words
              </Text>
            </View>
            <View style={styles.itemDate}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredItems.length === 0 && (
          <HistoryEmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  filterText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default HistoryScreen;
