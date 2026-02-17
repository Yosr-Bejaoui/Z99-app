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

interface Model {
  id: number;
  name: string;
  description?: string;
}

interface ModelSelectorProps {
  selected: number | string | null;
  onSelect: (id: number) => void;
  models?: Model[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onSelect, models = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedModel = models.find(m => m.id === selected);
  const displayName = selectedModel?.name || 'Select Model';

  const handleSelect = (id: number) => {
    onSelect(id);
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
            <FlatList
              data={models}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selected === item.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={styles.modelInfo}>
                    <Text style={[
                      styles.modelName,
                      selected === item.id && styles.modelNameSelected,
                    ]}>
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text style={styles.modelDescription}>{item.description}</Text>
                    )}
                  </View>
                  {selected === item.id && (
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
