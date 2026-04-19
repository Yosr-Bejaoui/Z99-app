import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import api from '../services/api';

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  plan_name: string;
  created_at: string;
  pdf_url?: string;
}

const InvoiceHistoryScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await api.get('/invoices/list/');
      const data = response.data.results || response.data || [];
      setInvoices(data);
    } catch (error: any) {
      // Endpoint may not exist — try transactions as fallback
      try {
        const txResponse = await api.get('/accounts/transactions/');
        const txData = txResponse.data.results || txResponse.data || [];
        const mapped = txData.map((tx: any, idx: number) => ({
          id: tx.id || idx,
          invoice_number: `TXN-${tx.id || idx}`,
          amount: Math.abs(tx.amount || tx.credits || 0),
          currency: 'USD',
          status: 'paid' as const,
          plan_name: tx.description || tx.model_name || 'Credit Transaction',
          created_at: tx.created_at || tx.timestamp || new Date().toISOString(),
        }));
        setInvoices(mapped);
      } catch {
        console.error('Failed to load invoices:', error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'refunded':
        return colors.secondary;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'refunded':
        return 'return-down-back';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const downloadInvoice = async (url?: string) => {
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Failed to open invoice:', error);
      }
    }
  };

  const totalSpent = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invoice History</Text>
          <Text style={styles.headerSubtitle}>Your payment records</Text>
        </View>

        {/* Summary Card */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Invoices</Text>
              <Text style={styles.summaryValue}>{invoices.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formatAmount(totalSpent, 'USD')}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Invoices Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your payment history will appear here
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.invoicesList}>
            {invoices.map((invoice) => (
              <GlassCard key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>
                      #{invoice.invoice_number || invoice.id}
                    </Text>
                    <Text style={styles.invoiceDate}>
                      {formatDate(invoice.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                    <Ionicons
                      name={getStatusIcon(invoice.status) as any}
                      size={14}
                      color={getStatusColor(invoice.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.invoiceBody}>
                  <View style={styles.planInfo}>
                    <Ionicons name="diamond-outline" size={18} color={colors.primary} />
                    <Text style={styles.planName}>{invoice.plan_name || 'Subscription'}</Text>
                  </View>
                  <Text style={styles.invoiceAmount}>
                    {formatAmount(invoice.amount, invoice.currency)}
                  </Text>
                </View>

                {invoice.pdf_url && (
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => downloadInvoice(invoice.pdf_url)}
                  >
                    <Ionicons name="download-outline" size={18} color={colors.primary} />
                    <Text style={styles.downloadText}>Download PDF</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  invoicesList: {
    gap: spacing.md,
  },
  invoiceCard: {
    marginBottom: spacing.xs,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  invoiceInfo: {},
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  invoiceDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  downloadText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InvoiceHistoryScreen;
