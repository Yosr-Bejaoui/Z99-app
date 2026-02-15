import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HelpScreenProps {
  navigation: any;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categories: CategoryItem[] = [
  { id: 'all', name: 'All', icon: 'apps', color: colors.primary },
  { id: 'account', name: 'Account', icon: 'person', color: '#0ea5e9' },
  { id: 'billing', name: 'Billing', icon: 'card', color: '#10b981' },
  { id: 'features', name: 'Features', icon: 'sparkles', color: '#8b5cf6' },
  { id: 'technical', name: 'Technical', icon: 'construct', color: '#f59e0b' },
];

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get started with AI Platform?',
    answer: 'Simply create an account using your email or Google sign-in. You\'ll receive 1,000 free words to start exploring our AI models. Navigate to the Chat tab to begin conversations with various AI models like ChatGPT, Gemini, and Claude.',
    category: 'account',
  },
  {
    id: '2',
    question: 'What AI models are available?',
    answer: 'We offer access to multiple AI models including:\n\n• ChatGPT (GPT-4) - General purpose AI\n• Google Gemini - Multimodal AI\n• Claude - Thoughtful AI assistant\n• DeepSeek - Advanced reasoning\n• DALL·E - Image generation\n• Stable Diffusion - Creative images\n\nMore models are added regularly!',
    category: 'features',
  },
  {
    id: '3',
    question: 'How does the credit system work?',
    answer: 'Credits are used to generate content. Different operations cost different amounts:\n\n• Chat messages: ~1 credit per response\n• Image generation: 5-20 credits per image\n• Video generation: 50-100 credits\n\nFree users get 1,000 credits monthly. Pro subscribers get unlimited access.',
    category: 'billing',
  },
  {
    id: '4',
    question: 'How do I upgrade to Pro?',
    answer: 'Go to the Credits tab in the app and tap "Upgrade to Pro". You can choose between monthly ($9.99/month) or annual ($99.99/year) plans. Payment is processed securely through Stripe. You can cancel anytime from your profile settings.',
    category: 'billing',
  },
  {
    id: '5',
    question: 'Can I use the app offline?',
    answer: 'AI Platform requires an internet connection to communicate with AI models. However, your chat history is cached locally, so you can view previous conversations offline. New messages require connectivity.',
    category: 'technical',
  },
  {
    id: '6',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Account > Change Password. Enter your current password, then your new password twice. If you forgot your password, use the "Forgot Password" option on the login screen to receive a reset link via email.',
    category: 'account',
  },
  {
    id: '7',
    question: 'Is my data secure?',
    answer: 'Yes! We take security seriously:\n\n• All data is encrypted in transit (TLS 1.3)\n• Conversations are stored securely on our servers\n• We never share your data with third parties\n• You can delete your data anytime\n• We comply with GDPR and CCPA regulations',
    category: 'account',
  },
  {
    id: '8',
    question: 'Why is my image generation taking long?',
    answer: 'Image generation typically takes 10-30 seconds depending on:\n\n• Model selected (DALL·E vs Stable Diffusion)\n• Image complexity and size\n• Server load\n\nIf it takes more than 2 minutes, try refreshing or using a different model.',
    category: 'technical',
  },
  {
    id: '9',
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Settings > Danger Zone > Delete Account. Note that this action is permanent and will delete all your data including chat history, generated images, and subscription. For account recovery, contact support within 30 days.',
    category: 'account',
  },
  {
    id: '10',
    question: 'Can I get a refund?',
    answer: 'We offer a 7-day money-back guarantee for new Pro subscribers. If you\'re not satisfied, contact support@aiplatform.com within 7 days of purchase for a full refund. After 7 days, refunds are handled case-by-case.',
    category: 'billing',
  },
];

const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
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
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.foregroundMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={colors.foregroundMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.foregroundMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
                selectedCategory === category.id && { borderColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={16}
                color={selectedCategory === category.id ? category.color : colors.foregroundMuted}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && { color: category.color },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.faqContainer}>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.foregroundMuted} />
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or category filter
              </Text>
            </View>
          ) : (
            filteredFAQs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Contact Support */}
        <GlassCard style={styles.contactCard}>
          <Ionicons name="chatbubbles" size={32} color={colors.primary} />
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is available 24/7 to assist you
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactButton, styles.contactButtonPrimary]}>
              <Ionicons name="chatbubble" size={18} color={colors.background} />
              <Text style={[styles.contactButtonText, styles.contactButtonTextPrimary]}>
                Live Chat
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#0ea5e920' }]}>
              <Ionicons name="book-outline" size={20} color="#0ea5e9" />
            </View>
            <Text style={styles.quickLinkText}>Documentation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="videocam-outline" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.quickLinkText}>Video Tutorials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="people-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.quickLinkText}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="newspaper-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.quickLinkText}>Blog</Text>
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSizes.md,
    color: colors.foreground,
  },
  categoriesContainer: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.surface,
  },
  categoryText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
  },
  faqContainer: {
    marginBottom: spacing.xl,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginRight: spacing.md,
  },
  faqAnswer: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
  },
  contactCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  contactTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  contactText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  contactButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contactButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.foreground,
  },
  contactButtonTextPrimary: {
    color: colors.background,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickLink: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLinkText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foreground,
    fontWeight: typography.fontWeights.medium,
  },
});

export default HelpScreen;
