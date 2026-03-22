import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  MessageSquare,
  Image,
  TrendingUp,
  TrendingDown,
  Activity,
  MoreVertical,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { analyticsService, DashboardStats } from '../services/analyticsService';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNeutral = change === 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-foreground-muted text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${isNeutral ? 'text-foreground-muted' : isPositive ? 'text-success' : 'text-error'}`}>
              {isNeutral ? <TrendingUp className="w-4 h-4" /> : isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
              <span className="text-foreground-muted text-sm">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMenu, setChartMenu] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usageData, setUsageData] = useState<{ date: string; sessions: number; messages: number; chats?: number }[]>([]);
  const [modelUsage, setModelUsage] = useState<{ name: string; usage_count: number; percentage: number }[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, usage, models] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getUsageAnalytics(30),
        analyticsService.getModelUsageStats(),
      ]);
      setStats(statsData);
      setUsageData(usage.map(u => ({
        date: u.date,
        sessions: u.sessions || u.chats || 0,
        messages: u.messages || 0,
        chats: u.chats || u.sessions || 0,
      })));
      // Map model usage to consistent format
      setModelUsage(models.map(m => ({
        name: m.model_name || 'Unknown',
        usage_count: m.usage_count || 0,
        percentage: m.percentage || 0,
      })));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Transform usage data for chart
  const usageChartData = {
    labels: usageData.slice(-7).map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Sessions',
        data: usageData.slice(-7).map(d => d.sessions || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Messages',
        data: usageData.slice(-7).map(d => d.messages || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Transform model usage for doughnut chart
  const modelUsageData = {
    labels: modelUsage.slice(0, 6).map(m => m.name),
    datasets: [
      {
        data: modelUsage.slice(0, 6).map(m => m.usage_count),
        backgroundColor: [
          '#10b981', // emerald
          '#6366f1', // indigo
          '#f43f5e', // rose
          '#f59e0b', // amber
          '#8b5cf6', // violet
          '#14b8a6', // teal
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(42, 42, 53, 0.5)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: 'rgba(42, 42, 53, 0.5)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    cutout: '70%',
  };

  // Recent activity (summary from actual stats)
  const recentActivity = [
    ...(stats?.users?.new_today ? [{ id: 1, type: 'user', message: `${stats.users.new_today} new user(s) today`, user: 'User registrations', time: 'Today' }] : []),
    ...(stats?.subscriptions?.total_active ? [{ id: 2, type: 'subscription', message: `${stats.subscriptions.total_active} active subscription(s)`, user: 'Subscription summary', time: 'Current' }] : []),
    ...(stats?.usage?.total_sessions ? [{ id: 3, type: 'chat', message: `${stats.usage.total_sessions} total chat sessions`, user: 'Platform usage', time: 'All time' }] : []),
    ...(stats?.models?.total ? [{ id: 4, type: 'image', message: `${stats.models.total} AI model(s) configured`, user: `Most used: ${stats.models.most_used || 'N/A'}`, time: 'Current' }] : []),
    ...(stats?.users?.total ? [{ id: 5, type: 'user', message: `${stats.users.total} total registered users`, user: 'Platform growth', time: 'All time' }] : []),
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4 text-primary" />;
      case 'subscription':
        return <CreditCard className="w-4 h-4 text-success" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-secondary" />;
      case 'image':
        return <Image className="w-4 h-4 text-accent" />;
      default:
        return <Activity className="w-4 h-4 text-foreground-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-foreground-muted mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-card border border-border text-foreground-muted rounded-xl hover:bg-surface hover:text-white transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.users.total?.toLocaleString() || '0'}
              change={stats?.users.growth_percentage}
              icon={Users}
              color="bg-emerald-600"
            />
            <StatCard
              title="Active Subscriptions"
              value={stats?.subscriptions.total_active?.toLocaleString() || '0'}
              change={stats?.subscriptions.revenue_growth}
              icon={CreditCard}
              color="bg-indigo-600"
            />
            <StatCard
              title="Total Sessions"
              value={stats?.usage.total_chats?.toLocaleString() || '0'}
              icon={MessageSquare}
              color="bg-rose-600"
            />
            <StatCard
              title="Revenue"
              value={`$${stats?.subscriptions.revenue_this_month?.toLocaleString() || '0'}`}
              change={stats?.subscriptions.revenue_growth}
              icon={Image}
              color="bg-amber-600"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Usage chart */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Usage Overview</h2>
                  <p className="text-foreground-muted text-sm">Chat and image generation trends</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setChartMenu(chartMenu === 'usage' ? null : 'usage')}
                    className="p-2 rounded-lg hover:bg-card transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-foreground-muted" />
                  </button>
                  {chartMenu === 'usage' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setChartMenu(null)} />
                      <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => { navigate('/analytics'); setChartMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => { setChartMenu(null); toast.success('Data exported'); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export Data
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="h-80">
                <Line data={usageChartData} options={chartOptions} />
              </div>
            </div>

            {/* Model usage */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Model Usage</h2>
                  <p className="text-foreground-muted text-sm">Distribution by model</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setChartMenu(chartMenu === 'model' ? null : 'model')}
                    className="p-2 rounded-lg hover:bg-card transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-foreground-muted" />
                  </button>
                  {chartMenu === 'model' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setChartMenu(null)} />
                      <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => { navigate('/models'); setChartMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                          View All Models
                        </button>
                        <button
                          onClick={() => { navigate('/analytics'); setChartMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          Full Analytics
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="h-64">
                <Doughnut data={modelUsageData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent activity */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <p className="text-foreground-muted text-sm">Latest platform events</p>
                </div>
                <button onClick={() => navigate('/analytics')} className="text-primary text-sm font-medium hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-card transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-card">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{activity.message}</p>
                      <p className="text-xs text-foreground-muted truncate">{activity.user}</p>
                    </div>
                    <span className="text-xs text-foreground-muted whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top models */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Top AI Models</h2>
                  <p className="text-foreground-muted text-sm">Most used this month</p>
                </div>
                <button onClick={() => navigate('/models')} className="text-primary text-sm font-medium hover:underline">
                  Manage
                </button>
              </div>
              <div className="space-y-4">
                {modelUsage.slice(0, 5).map((model) => (
                  <div key={model.name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm text-white font-medium">{model.name}</span>
                        </div>
                        <span className="text-sm text-foreground-muted">
                          {model.usage_count?.toLocaleString() || 0} uses
                        </span>
                      </div>
                      <div className="h-2 bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                          style={{ width: `${model.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {modelUsage.length === 0 && (
                  <p className="text-foreground-muted text-sm text-center py-4">No model usage data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
