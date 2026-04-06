import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useDrawer } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import { HistoryEmptyState } from '../components/EmptyState';
import { historyService, mediaService, getErrorMessage } from '../services';
import type { HistoryItem } from '../services/types';
import GlassCard from '../components/GlassCard';

type FilterType = 'all' | 'chat' | 'image' | 'video' | 'audio' | '3d';

interface HistoryScreenProps {
  navigation?: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { openDrawer, navigateTo } = useDrawer();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Re-fetch when filter changes
  useEffect(() => {
    fetchHistory(filter === 'all' ? undefined : filter);
  }, [filter]);

  const fetchHistory = async (type?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = { page_size: 15 };
      if (type) params.type = type;
      const response = await historyService.getHistory(params);
      setHistoryItems(response.results);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timer
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    if (query.trim().length === 0) {
      fetchHistory();
      return;
    }
    
    // Debounce search by 500ms
    if (query.trim().length >= 2) {
      searchTimerRef.current = setTimeout(async () => {
        try {
          const results = await historyService.searchHistory(query);
          setHistoryItems(results);
        } catch (err) {
          console.error('Search failed:', err);
        }
      }, 500);
    }
  };

  const handleDeleteItem = (item: HistoryItem) => {
    Alert.alert(
      t('history.deleteItem.title'),
      t('history.deleteItem.message', { title: item.title }),
      [
        { text: t('history.deleteItem.cancel'), style: 'cancel' },
        { 
          text: t('history.deleteItem.confirm'), 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await historyService.deleteHistoryItem(item.id);
              setHistoryItems(prev => prev.filter(i => i.id !== item.id));
              if (selectedItem?.id === item.id) {
                setSelectedItem(null);
              }
              Alert.alert(t('common.success'), t('history.deleteItem.success'));
            } catch (err) {
              Alert.alert(t('common.error'), getErrorMessage(err));
            } finally {
              setIsDeleting(false);
            }
          }
        },
      ]
    );
  };

  const handleDownload = async (item: HistoryItem) => {
    if (!item.content_url) {
      Alert.alert(t('common.error'), t('history.download.noContent'));
      return;
    }
    
    try {
      let result;
      if (item.type === 'image') {
        result = await mediaService.saveImageToGallery(item.content_url);
      } else if (item.type === 'video') {
        result = await mediaService.saveVideoToGallery(item.content_url);
      } else if (item.type === 'audio') {
        result = await mediaService.saveAudioFile(item.content_url);
      } else {
        Alert.alert(t('common.error'), t('history.download.notSupported'));
        return;
      }
      
      if (result.success) {
        Alert.alert(t('common.success'), t('history.download.success'));
      } else {
        Alert.alert(t('common.error'), result.error || t('history.download.error'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  // Server already filters by type when filter changes, so no local re-filter needed
  const filteredItems = historyItems;

  const getIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'chat': return 'chatbubble-outline';
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      case '3d': return 'cube-outline';
      default: return 'document-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return t('history.date.justNow');
    if (hours < 24) return t('history.date.hoursAgo', { count: hours });
    if (days < 7) return t('history.date.daysAgo', { count: days });
    return date.toLocaleDateString();
  };

  const renderDetailModal = () => (
    <Modal
      visible={selectedItem !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedItem(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>{selectedItem?.title}</Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          {selectedItem?.preview_url && (
            <Image
              source={{ uri: selectedItem.preview_url }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
          
          <View style={styles.modalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('history.detail.model')}</Text>
              <Text style={styles.detailValue}>{selectedItem?.model}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('history.detail.type')}</Text>
              <Text style={styles.detailValue}>{selectedItem?.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('history.detail.wordsUsed')}</Text>
              <Text style={styles.detailValue}>{selectedItem?.words_used || 0}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('history.detail.created')}</Text>
              <Text style={styles.detailValue}>
                {selectedItem?.created_at ? formatDate(selectedItem.created_at) : t('history.detail.unknown')}
              </Text>
            </View>
            {selectedItem?.prompt && (
              <View style={styles.promptSection}>
                <Text style={styles.detailLabel}>{t('history.detail.prompt')}</Text>
                <Text style={styles.promptText}>{selectedItem.prompt}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.modalActions}>
            {selectedItem?.type === 'chat' && selectedItem?.session_id && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.continueButton]}
                onPress={() => {
                  setSelectedItem(null);
                  // Use drawer navigation to pass sessionId
                  navigateTo('ChatScreen', { sessionId: selectedItem.session_id });
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>{t('history.detail.continue')}</Text>
              </TouchableOpacity>
            )}
            {selectedItem?.content_url && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => selectedItem && handleDownload(selectedItem)}
              >
                <Ionicons name="download-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>{t('history.detail.download')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => selectedItem && handleDeleteItem(selectedItem)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{t('history.detail.delete')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={openDrawer}
        >
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <View style={styles.headerButton} />
      </View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('history.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <GlassCard style={styles.errorCard}>
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Filter Tabs */}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterContainer}
      >
        {(['all', 'chat', 'image'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            {f !== 'all' && (
              <Ionicons
                name={getIcon(f as HistoryItem['type'])}
                size={14}
                color={filter === f ? colors.primary : colors.textMuted}
              />
            )}
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? t('history.filter.all') : f === '3d' ? t('history.filter.threeD') : t(`history.filter.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State */}
      {isLoading && (
          <View style={{ padding: 16 }}>
            <SkeletonList count={5} height={120} spacing={16} />
          </View>
        )}

      {/* History List */}
      {!isLoading && (
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
          {filteredItems.slice(0, 20).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.historyItem}
              onPress={() => setSelectedItem(item)}
              onLongPress={() => handleDeleteItem(item)}
            >
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
                  {item.model} · {item.words_used || 0} {t('history.itemMeta.words')}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <View style={styles.itemDate}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.dateText}>{formatDate(item.created_at || item.date)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteIcon}
                  onPress={() => handleDeleteItem(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {filteredItems.length === 0 && !searchQuery && (
            <HistoryEmptyState />
          )}

          {filteredItems.length === 0 && searchQuery && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.noResultsText}>{t('history.noResults', { query: searchQuery })}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
  },
  filterScrollContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  filterText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  itemDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteIcon: {
    padding: spacing.xs,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  noResultsText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginBottom: spacing.lg,
  },
  modalDetails: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  promptSection: {
    marginTop: spacing.sm,
  },
  promptText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  continueButton: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    color: colors.error,
  },
});

export default HistoryScreen;
