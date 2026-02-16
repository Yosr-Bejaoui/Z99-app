import { useState, useEffect } from 'react';
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
  
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-foreground-muted text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Messages',
        data: usageData.slice(-7).map(d => d.messages || 0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
          '#2dd4bf',
          '#8b5cf6',
          '#f97316',
          '#22c55e',
          '#f59e0b',
          '#6b7280',
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

  // Mock recent activity
  const recentActivity = [
    { id: 1, type: 'user', message: 'New user registered', user: 'john@example.com', time: '2 min ago' },
    { id: 2, type: 'subscription', message: 'Subscription upgrade', user: 'sarah@example.com', time: '15 min ago' },
    { id: 3, type: 'chat', message: 'Chat session started', user: 'mike@example.com', time: '32 min ago' },
    { id: 4, type: 'image', message: 'Image generated', user: 'emma@example.com', time: '1 hour ago' },
    { id: 5, type: 'user', message: 'User verified email', user: 'alex@example.com', time: '2 hours ago' },
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
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
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
              color="bg-primary"
            />
            <StatCard
              title="Active Subscriptions"
              value={stats?.subscriptions.total_active?.toLocaleString() || '0'}
              change={stats?.subscriptions.revenue_growth}
              icon={CreditCard}
              color="bg-secondary"
            />
            <StatCard
              title="Total Sessions"
              value={stats?.usage.total_chats?.toLocaleString() || '0'}
              icon={MessageSquare}
              color="bg-accent"
            />
            <StatCard
              title="Revenue"
              value={`$${stats?.subscriptions.revenue_this_month?.toLocaleString() || '0'}`}
              change={stats?.subscriptions.revenue_growth}
              icon={Image}
              color="bg-success"
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
            <button className="p-2 rounded-lg hover:bg-card transition-colors">
              <MoreVertical className="w-5 h-5 text-foreground-muted" />
            </button>
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
            <button className="p-2 rounded-lg hover:bg-card transition-colors">
              <MoreVertical className="w-5 h-5 text-foreground-muted" />
            </button>
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
            <button className="text-primary text-sm font-medium hover:underline">
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
            <button className="text-primary text-sm font-medium hover:underline">
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
