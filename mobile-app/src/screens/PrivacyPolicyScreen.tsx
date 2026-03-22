import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface PrivacyPolicyScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>{t('privacy.lastUpdated')}</Text>
          <Text style={styles.dateValue}>February 19, 2026</Text>
        </View>

        {/* Content */}
        <GlassCard style={styles.contentCard}>
          <Section title="1. Introduction">
            <Text style={styles.text}>
              We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
          </Section>

          <Section title="2. Information We Collect">
            <Text style={styles.text}>
              <Text style={styles.bold}>Personal Information:</Text> Name, email address, phone number, and account credentials.
            </Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>Usage Data:</Text> Information about how you interact with our app, including features used and content generated.
            </Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>Device Information:</Text> Device type, operating system, and unique device identifiers.
            </Text>
          </Section>

          <Section title="3. How We Use Your Information">
            <Text style={styles.text}>
              • Provide and maintain our services{'\n'}
              • Process transactions and send related information{'\n'}
              • Send promotional communications (with your consent){'\n'}
              • Improve and optimize our app{'\n'}
              • Monitor and analyze trends and usage{'\n'}
              • Detect and prevent fraudulent activity
            </Text>
          </Section>

          <Section title="4. Data Security">
            <Text style={styles.text}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </Text>
          </Section>

          <Section title="5. Third-Party Sharing">
            <Text style={styles.text}>
              We do not sell your personal information. We may share information with service providers who assist in operating our app and conducting our business, subject to confidentiality obligations.
            </Text>
          </Section>

          <Section title="6. Your Privacy Rights">
            <Text style={styles.text}>
              You have the right to access, correct, or delete your personal information. You may also opt-out of receiving promotional communications at any time.
            </Text>
          </Section>

          <Section title="7. Cookies and Tracking">
            <Text style={styles.text}>
              We use cookies and similar tracking technologies to track activity in our app and hold certain information to improve user experience.
            </Text>
          </Section>

          <Section title="8. Changes to This Policy">
            <Text style={styles.text}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </Text>
          </Section>

          <Section title="9. Contact Us">
            <Text style={styles.text}>
              If you have questions about this Privacy Policy, please contact us at:{'\n'}
              Email: support@aimodel.com{'\n'}
              Support Portal: support.aimodel.com
            </Text>
          </Section>
        </GlassCard>

        {/* Footer */}
        <Text style={styles.footerText}>
          {t('privacy.footer')}
        </Text>
      </ScrollView>
    </View>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

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
  dateCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contentCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
});

export default PrivacyPolicyScreen;
