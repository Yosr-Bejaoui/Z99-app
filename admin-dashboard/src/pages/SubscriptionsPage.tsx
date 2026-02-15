import { useState } from 'react';
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
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  name: string;
  price: number;
  duration: string;
  wordLimit: number;
  imageLimit: number;
  features: string[];
  subscriberCount: number;
  isActive: boolean;
}

interface Subscription {
  id: number;
  user: string;
  email: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  amount: number;
}

// Mock data
const mockPlans: Plan[] = [
  {
    id: 1,
    name: 'Free',
    price: 0,
    duration: 'Forever',
    wordLimit: 5000,
    imageLimit: 10,
    features: ['Basic chat models', '5,000 words/month', '10 images/month'],
    subscriberCount: 8542,
    isActive: true,
  },
  {
    id: 2,
    name: 'Pro',
    price: 19.99,
    duration: 'Monthly',
    wordLimit: 100000,
    imageLimit: 500,
    features: ['All chat models', '100K words/month', '500 images/month', 'Priority support'],
    subscriberCount: 2845,
    isActive: true,
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 99.99,
    duration: 'Monthly',
    wordLimit: -1,
    imageLimit: -1,
    features: ['Unlimited words', 'Unlimited images', 'API access', 'Dedicated support', 'Custom models'],
    subscriberCount: 342,
    isActive: true,
  },
];

const mockSubscriptions: Subscription[] = [
  { id: 1, user: 'John Doe', email: 'john@example.com', plan: 'Pro', status: 'active', startDate: '2024-01-15', endDate: '2024-02-15', amount: 19.99 },
  { id: 2, user: 'Sarah Smith', email: 'sarah@example.com', plan: 'Enterprise', status: 'active', startDate: '2024-01-20', endDate: '2024-02-20', amount: 99.99 },
  { id: 3, user: 'Mike Johnson', email: 'mike@example.com', plan: 'Pro', status: 'cancelled', startDate: '2024-01-10', endDate: '2024-02-10', amount: 19.99 },
  { id: 4, user: 'Emma Wilson', email: 'emma@example.com', plan: 'Pro', status: 'active', startDate: '2024-01-28', endDate: '2024-02-28', amount: 19.99 },
  { id: 5, user: 'Alex Brown', email: 'alex@example.com', plan: 'Pro', status: 'expired', startDate: '2023-12-05', endDate: '2024-01-05', amount: 19.99 },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Calculate stats
  const stats = {
    totalRevenue: subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
    activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
    churnRate: ((subscriptions.filter((s) => s.status === 'cancelled').length / subscriptions.length) * 100).toFixed(1),
    totalSubscribers: plans.reduce((sum, p) => sum + p.subscriberCount, 0),
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const togglePlanStatus = (planId: number) => {
    setPlans(plans.map((p) => (p.id === planId ? { ...p, isActive: !p.isActive } : p)));
    toast.success('Plan status updated');
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-foreground-muted mt-1">Manage plans and subscriptions</p>
        </div>
        <button
          onClick={() => setShowPlanModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
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
                plan.isActive ? 'border-border hover:border-primary/50' : 'border-border opacity-60'
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
                          plan.isActive ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                        }`}
                      >
                        {plan.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {plan.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {plan.name !== 'Free' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this plan?')) {
                              setPlans(plans.filter((p) => p.id !== plan.id));
                              toast.success('Plan deleted');
                            }
                            setActiveDropdown(null);
                          }}
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
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-foreground-muted">/{plan.duration.toLowerCase()}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground-muted text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-sm">Subscribers</span>
                  <span className="text-white font-semibold">{plan.subscriberCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{sub.user}</p>
                          <p className="text-sm text-foreground-muted">{sub.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(sub.status)}`}>
                          {sub.status === 'active' && <Check className="w-3 h-3" />}
                          {sub.status === 'cancelled' && <X className="w-3 h-3" />}
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-foreground-muted text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">${sub.amount}</span>
                      </td>
                    </tr>
                  ))}
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
