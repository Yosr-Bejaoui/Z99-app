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

interface TermsOfServiceScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TermsOfService'>;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
        <View style={styles.headerSpacer} />
      
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>{t('terms.lastUpdated')}</Text>
          <Text style={styles.dateValue}>February 19, 2026</Text>
        </View>

        {/* Content */}
        <GlassCard style={styles.contentCard}>
          <Section title="1. Acceptance of Terms">
            <Text style={styles.text}>
              By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
            </Text>
          </Section>

          <Section title="2. Use License">
            <Text style={styles.text}>
              Permission is granted to temporarily download one copy of the materials (information or software) on our application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license, you may not:
            </Text>
            <Text style={styles.text}>
              • Modify or copy the materials{'\n'}
              • Use the materials for any commercial purpose or for any public display{'\n'}
              • Attempt to decompile or reverse engineer any software{'\n'}
              • Remove any copyright or other proprietary notations from the materials{'\n'}
              • Transfer the materials to another person or "mirror" the materials on any other server
            </Text>
          </Section>

          <Section title="3. Disclaimer of Warranties">
            <Text style={styles.text}>
              The materials on our application are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Text>
          </Section>

          <Section title="4. Limitations of Liability">
            <Text style={styles.text}>
              In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our application.
            </Text>
          </Section>

          <Section title="5. Accuracy of Materials">
            <Text style={styles.text}>
              The materials appearing on our application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our application are accurate, complete, or current. We may make changes to the materials contained on our application at any time without notice.
            </Text>
          </Section>

          <Section title="6. Materials License">
            <Text style={styles.text}>
              The materials on our application are subject to intellectual property rights. All rights are reserved, and reproduction of any part is strictly prohibited unless explicit permission is granted.
            </Text>
          </Section>

          <Section title="7. Limitations on Use">
            <Text style={styles.text}>
              In addition to other prohibitions contained herein, you are prohibited from:
            </Text>
            <Text style={styles.text}>
              • Harassing or causing distress or inconvenience to any person{'\n'}
              • Obscene or abusive language or content{'\n'}
              • Disrupting the normal flow of dialogue within our application{'\n'}
              • Attempting to gain unauthorized access to our systems
            </Text>
          </Section>

          <Section title="8. User-Generated Content">
            <Text style={styles.text}>
              You retain all rights to any content you submit, post, or display on or through the application. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any media or distribution method.
            </Text>
          </Section>

          <Section title="9. Assumption of Risk">
            <Text style={styles.text}>
              Your use of our application is at your own risk. We assume no responsibility for any errors, omissions, or inaccuracies in the content or services provided.
            </Text>
          </Section>

          <Section title="10. Governing Law">
            <Text style={styles.text}>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where we are located.
            </Text>
          </Section>

          <Section title="11. Severability">
            <Text style={styles.text}>
              If any provision of these terms and conditions is deemed invalid or otherwise unenforceable, the remaining provisions shall continue in effect.
            </Text>
          </Section>

          <Section title="12. Changes to Terms">
            <Text style={styles.text}>
              We reserve the right to modify these terms and conditions at any time. Your continued use of the application following the posting of revised terms will indicate your acceptance of the revised terms.
            </Text>
          </Section>

          <Section title="13. Contact Information">
            <Text style={styles.text}>
              If you have any questions about these Terms of Service, please contact us at:{'\n'}
              Email: support@aimodel.com{'\n'}
              Support Portal: support.aimodel.com
            </Text>
          </Section>
        </GlassCard>

        {/* Footer */}
        <Text style={styles.footerText}>
          {t('terms.footer')}
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
    marginBottom: spacing.md,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  dateValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contentCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
});

export default TermsOfServiceScreen;
