import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CreditCard,
  Check,
  X,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionsService, Plan, Subscription } from '../services/subscriptionsService';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: '0',
    totalSubscribers: 0,
  });

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch plans
      const plansData = await subscriptionsService.getPlans();
      setPlans(plansData.map(p => ({ ...p, is_active: p.is_active ?? true })));

      // Fetch subscriptions
      const subscriptionsData = await subscriptionsService.getSubscriptions();
      setSubscriptions(subscriptionsData.results || []);

      // Fetch stats
      const statsData = await subscriptionsService.getSubscriptionStats();
      setStats({
        totalRevenue: statsData.revenue_this_month || 0,
        activeSubscriptions: statsData.active_subscriptions || 0,
        churnRate: statsData.cancelled_subscriptions > 0 
          ? ((statsData.cancelled_subscriptions / (statsData.total_subscriptions || 1)) * 100).toFixed(1)
          : '0',
        totalSubscribers: statsData.total_subscriptions || 0,
      });

    } catch (error) {
      console.error('Error fetching subscriptions data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const userEmail = sub.user?.email || '';
    const userName = sub.user?.name || '';
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle cancel subscription
  const handleCancelSubscription = async (subId: number) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await subscriptionsService.cancelSubscription(subId);
        setSubscriptions(subscriptions.map(s => 
          s.id === subId ? { ...s, status: 'cancelled' } : s
        ));
        toast.success('Subscription cancelled');
      } catch (error) {
        toast.error('Failed to cancel subscription');
      }
    }
  };

  // Handle extend subscription
  const handleExtendSubscription = async (subId: number, days: number = 30) => {
    try {
      const updated = await subscriptionsService.extendSubscription(subId, days);
      setSubscriptions(subscriptions.map(s => 
        s.id === subId ? updated : s
      ));
      toast.success(`Subscription extended by ${days} days`);
    } catch (error) {
      toast.error('Failed to extend subscription');
    }
  };

  const togglePlanStatus = async (planId: number) => {
    try {
      setPlans(plans.map((p) => (p.id === planId ? { ...p, is_active: !p.is_active } : p)));
      toast.success('Plan status updated');
    } catch (error) {
      toast.error('Failed to update plan status');
    }
    setActiveDropdown(null);
  };

  const handleDeletePlan = async (planId: number) => {
    if (confirm('Delete this plan?')) {
      try {
        await subscriptionsService.deletePlan(planId);
        setPlans(plans.filter((p) => p.id !== planId));
        toast.success('Plan deleted');
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
    setActiveDropdown(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-success/10 text-success border-success/20',
      cancelled: 'bg-warning/10 text-warning border-warning/20',
      expired: 'bg-error/10 text-error border-error/20',
    };
    return styles[status as keyof typeof styles] || styles.expired;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-foreground-muted mt-1">Manage plans and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-white rounded-xl hover:bg-surface transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-foreground-muted text-sm">Monthly Revenue</p>
              <p className="text-xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground-muted text-sm">Active Subs</p>
              <p className="text-xl font-bold text-white">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-foreground-muted text-sm">Total Users</p>
              <p className="text-xl font-bold text-white">{stats.totalSubscribers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-foreground-muted text-sm">Churn Rate</p>
              <p className="text-xl font-bold text-white">{stats.churnRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'plans' ? 'text-primary' : 'text-foreground-muted hover:text-white'
          }`}
        >
          Plans
          {activeTab === 'plans' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'subscriptions' ? 'text-primary' : 'text-foreground-muted hover:text-white'
          }`}
        >
          Subscriptions
          {activeTab === 'subscriptions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Plans tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface border rounded-2xl p-6 transition-all relative ${
                plan.is_active ? 'border-border hover:border-primary/50' : 'border-border opacity-60'
              }`}
            >
              {/* Menu button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === plan.id ? null : plan.id)}
                  className="p-2 rounded-lg hover:bg-card transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-foreground-muted" />
                </button>

                {activeDropdown === plan.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => {
                          toast.success('Edit plan modal would open');
                          setActiveDropdown(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => togglePlanStatus(plan.id)}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                          plan.is_active ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                        }`}
                      >
                        {plan.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {plan.is_active ? 'Disable' : 'Enable'}
                      </button>
                      {plan.amount > 0 && (
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name || plan.plan_code}</h3>
                <p className="text-foreground-muted text-xs mt-1">{plan.plan_code}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">${plan.amount}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground-muted text-sm">{plan.words_or_credits.toLocaleString()} credits/words</span>
                </div>
                {plan.description && (
                  <p className="text-foreground-muted text-sm">{plan.description}</p>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-sm">Created</span>
                  <span className="text-white font-semibold text-sm">{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-12 text-foreground-muted">
              No plans found. Create your first plan to get started.
            </div>
          )}
        </div>
      )}

      {/* Subscriptions tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">User</th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">Plan</th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">Status</th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">Period</th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{sub.user?.name || sub.user?.email?.split('@')[0] || 'Unknown'}</p>
                          <p className="text-sm text-foreground-muted">{sub.user?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                          {sub.plan?.name || 'Unknown Plan'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(sub.status)}`}>
                          {sub.status === 'active' && <Check className="w-3 h-3" />}
                          {sub.status === 'cancelled' && <X className="w-3 h-3" />}
                          {sub.status === 'expired' && <Clock className="w-3 h-3" />}
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-foreground-muted text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">${sub.price || 0}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {sub.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleExtendSubscription(sub.id, 30)}
                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                                title="Extend 30 days"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleCancelSubscription(sub.id)}
                                className="px-2 py-1 text-xs bg-error/10 text-error rounded hover:bg-error/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {sub.status === 'expired' && (
                            <button
                              onClick={() => handleExtendSubscription(sub.id, 30)}
                              className="px-2 py-1 text-xs bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubscriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-foreground-muted">
                        No subscriptions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Create New Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g., Business"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Price</label>
                  <input
                    type="number"
                    placeholder="49.99"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Duration</label>
                  <select className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors">
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Word Limit</label>
                  <input
                    type="number"
                    placeholder="50000"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Image Limit</label>
                  <input
                    type="number"
                    placeholder="200"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Plan would be created');
                  setShowPlanModal(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
