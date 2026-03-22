import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface AboutScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'About'>;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.log('Error opening link:', err));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Icon and Title */}
        <View style={styles.appInfoCard}>
          <View style={styles.appIconContainer}>
            <Ionicons name="sparkles" size={50} color={colors.primary} />
          </View>
          <Text style={styles.appName}>{t('about.appName')}</Text>
          <Text style={styles.appVersion}>{t('about.version')}</Text>
        </View>

        {/* Description */}
        <GlassCard style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>{t('about.aboutTitle')}</Text>
          <Text style={styles.descriptionText}>
            Your all-in-one AI assistant for image generation, video creation, text-to-speech, and more.
          </Text>
        </GlassCard>

        {/* Contact */}
        <GlassCard style={styles.linksCard}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('mailto:support@aimodel.com')}
          >
            <View style={styles.linkIconContainer}>
              <Ionicons name="mail" size={18} color={colors.primary} />
            </View>
            <Text style={styles.linkText}>support@aimodel.com</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Legal */}
        <GlassCard style={styles.legalCard}>
          <Text style={styles.copyrightText}>
            © 2026 Z99. All rights reserved.
          </Text>
        </GlassCard>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  appInfoCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  appVersion: {
    fontSize: 13,
    color: colors.textMuted,
  },
  descriptionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  linksCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legalCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default AboutScreen;
