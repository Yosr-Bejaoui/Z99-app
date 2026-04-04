import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import { getCleanModelName } from '../utils/modelUtils';

interface Model {
  id: number;
  name: string;
  description?: string;
  [key: string]: any;
}

interface ModelSelectorProps {
  selected: number | string | { id: number } | null;
  onSelect: (model: Model) => void;
  models?: Model[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onSelect, models = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  const selectedId = selected && typeof selected === 'object' ? selected.id : selected;
  const selectedModel = models.find(m => m.id === selectedId);
  const displayName = selectedModel ? getCleanModelName(selectedModel.name) : 'Select Model';

  const filteredModels = models.filter(m => {
    if (filter === 'all') return true;
    const isFree = !m.base_cost || m.base_cost === 0 || m.name.toLowerCase().includes('free');
    return filter === 'free' ? isFree : !isFree;
  });

  const handleSelect = (model: Model) => {
    onSelect(model);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.selector} 
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {displayName}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={18} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Model</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
              <TouchableOpacity style={[styles.tab, filter === 'all' && styles.tabActive]} onPress={() => setFilter('all')}>
                <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, filter === 'free' && styles.tabActive]} onPress={() => setFilter('free')}>
                <Text style={[styles.tabText, filter === 'free' && styles.tabTextActive]}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, filter === 'premium' && styles.tabActive]} onPress={() => setFilter('premium')}>
                <Text style={[styles.tabText, filter === 'premium' && styles.tabTextActive]}>Premium</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredModels}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedId === item.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.modelInfo}>
                    <Text style={[
                      styles.modelName,
                      selectedId === item.id && styles.modelNameSelected,
                    ]}>
                      {getCleanModelName(item.name)}
                    </Text>
                  </View>
                  {selectedId === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minWidth: 140,
  },
  selectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dropdown: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 340,
    maxHeight: 400,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.surfaceHover,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownItemSelected: {
    backgroundColor: colors.surfaceHover,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  modelNameSelected: {
    color: colors.primary,
  },
  modelDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});

export default ModelSelector;
