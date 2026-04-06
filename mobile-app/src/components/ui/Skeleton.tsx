import { spacing } from '../../theme/colors';
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonListProps {
  count?: number;
  height?: number;
  spacing?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  height = 16,
  spacing = 12,
}) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={index % 2 === 0 ? '100%' : '70%'}
          height={height}
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={14} style={{ marginBottom: spacing.sm }} />
        {Array.from({ length: lines - 1 }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 2 ? '80%' : '100%'}
            height={12}
            style={{ marginBottom: spacing.xs }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  list: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
});

export default Skeleton;
