import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface Model {
  id: number;
  name: string;
  color?: string;
}

// Default models if none provided
const defaultModels: Model[] = [
  { id: 1, name: 'ChatGPT', color: '#10b981' },
  { id: 2, name: 'Gemini', color: '#3b82f6' },
  { id: 3, name: 'Claude', color: '#f59e0b' },
  { id: 4, name: 'Mistral', color: '#f97316' },
  { id: 5, name: 'DeepSeek', color: '#8b5cf6' },
];

// Color palette for models
const modelColors = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

interface ModelSelectorProps {
  selected: number | string | null;
  onSelect: (id: number) => void;
  models?: Model[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onSelect, models }) => {
  const displayModels = models && models.length > 0 ? models : defaultModels;
  
  const getShortName = (name: string): string => {
    // Generate short name from model name
    if (name.length <= 4) return name.toUpperCase();
    const words = name.split(/[\s-_]+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    }
    return name.slice(0, 3).toUpperCase();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayModels.map((model, index) => (
          <TouchableOpacity
            key={model.id}
            onPress={() => onSelect(model.id)}
            style={[
              styles.modelButton,
              selected === model.id && styles.modelButtonSelected,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: model.color || modelColors[index % modelColors.length] }]} />
            <Text
              style={[
                styles.modelName,
                selected === model.id && styles.modelNameSelected,
              ]}
            >
              {getShortName(model.name)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 6,
  },
  scrollContent: {
    gap: 6,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  modelButtonSelected: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modelName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  modelNameSelected: {
    color: colors.primary,
  },
});

export default ModelSelector;
