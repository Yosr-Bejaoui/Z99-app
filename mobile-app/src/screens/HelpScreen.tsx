import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../components';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface HelpScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Help'>;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get started?',
    answer: 'Create an account and start chatting with AI models. You get free credits to begin.',
  },
  {
    id: '2',
    question: 'How does the credit system work?',
    answer: 'Credits are used for AI responses and image generation. Free users get monthly credits, Pro users get unlimited access.',
  },
  {
    id: '3',
    question: 'How do I upgrade to Pro?',
    answer: 'Go to Credits tab and tap "Upgrade to Pro". You can cancel anytime.',
  },
  {
    id: '4',
    question: 'How do I reset my password?',
    answer: 'Use "Forgot Password" on the login screen to receive a reset code via email.',
  },
];

const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@z99.ai');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1e24', '#0f1115', '#0a0c0f']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={styles.placeholder} />
      
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {faqData.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            activeOpacity={0.7}
            onPress={() => toggleExpand(faq.id)}
          >
            <GlassCard style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.foregroundMuted}
                />
              </View>
              {expandedId === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Need More Help?</Text>
        <TouchableOpacity onPress={handleContactSupport}>
          <GlassCard style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Contact Support</Text>
              <Text style={styles.contactSubtitle}>support@z99.ai</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.foregroundMuted} />
          </GlassCard>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: { gap: spacing.lg, paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  faqCard: {
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.foreground,
  },
  contactSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
});

export default HelpScreen;
