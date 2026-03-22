import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Users,
  MessageSquare,
  Image,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
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

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalImages: 0,
    totalRevenue: 0,
    userGrowth: 0,
    sessionGrowth: 0,
    imageGrowth: 0,
    revenueGrowth: 0,
  });
  const [usageData, setUsageData] = useState<{ date: string; count: number }[]>([]);
  const [modelUsage, setModelUsage] = useState<{ model: string; count: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; amount: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ id: number; email: string; name: string; total_usage: number; subscription_plan: string }[]>([]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

      const [dashboardStats, usage, models, revenue, users] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getUsageAnalytics(days),
        analyticsService.getModelUsageStats(),
        analyticsService.getRevenueAnalytics(days).catch(() => []),
        analyticsService.getTopUsers(5).catch(() => []),
      ]);

      setStats({
        totalUsers: dashboardStats.users?.total || 0,
        totalSessions: dashboardStats.usage?.total_chats || 0,
        totalImages: dashboardStats.usage?.total_images || 0,
        totalRevenue: dashboardStats.subscriptions?.revenue_this_month || 0,
        userGrowth: dashboardStats.users?.growth_percentage || 0,
        sessionGrowth: 0,
        imageGrowth: 0,
        revenueGrowth: dashboardStats.subscriptions?.revenue_growth || 0,
      });

      if (usage && usage.length > 0) {
        setUsageData(usage.map(u => ({ date: u.date, count: u.sessions || u.chats || 0 })));
      }

      if (models && models.length > 0) {
        setModelUsage(models.map(m => ({ model: m.model_name, count: m.usage_count })));
      }

      if (revenue && revenue.length > 0) {
        setRevenueData(revenue.map(r => ({ date: r.date, amount: r.amount || 0 })));
      }

      if (users && users.length > 0) {
        setTopUsers(users);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Chart colors
  const chartColors = ['#2dd4bf', '#8b5cf6', '#f97316', '#22c55e', '#f59e0b', '#6b7280', '#ec4899', '#06b6d4'];

  // Dynamic chart data based on API response
  const userGrowthData = {
    labels: usageData.length > 0 ? usageData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : ['No data'],
    datasets: [
      {
        label: 'Daily Usage',
        data: usageData.length > 0 ? usageData.map(d => d.count) : [0],
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: revenueData.length > 0
      ? revenueData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      : ['No data'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: revenueData.length > 0 ? revenueData.map(d => d.amount) : [0],
        backgroundColor: '#2dd4bf',
        borderRadius: 8,
      },
    ],
  };

  const usageByModelData = {
    labels: modelUsage.length > 0 ? modelUsage.map(m => m.model) : ['No data'],
    datasets: [
      {
        data: modelUsage.length > 0 ? modelUsage.map(m => m.count) : [1],
        backgroundColor: modelUsage.length > 0 ? chartColors.slice(0, modelUsage.length) : ['#6b7280'],
        borderWidth: 0,
      },
    ],
  };

  const dailyUsageData = {
    labels: usageData.length > 0 ? usageData.slice(-7).map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) : ['No data'],
    datasets: [
      {
        label: 'Sessions',
        data: usageData.length > 0 ? usageData.slice(-7).map(d => d.count) : [0],
        backgroundColor: '#2dd4bf',
        borderRadius: 8,
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

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        stacked: false,
      },
      y: {
        ...chartOptions.scales.y,
        stacked: false,
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
    cutout: '65%',
  };

  // Stats summary with dynamic data
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: stats.userGrowth, icon: Users, color: 'text-primary' },
    { label: 'Chat Sessions', value: stats.totalSessions.toLocaleString(), change: stats.sessionGrowth, icon: MessageSquare, color: 'text-secondary' },
    { label: 'Images Generated', value: stats.totalImages.toLocaleString(), change: stats.imageGrowth, icon: Image, color: 'text-accent' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: stats.revenueGrowth, icon: DollarSign, color: 'text-success' },
  ];

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
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-foreground-muted mt-1">Track your platform performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                    ? 'bg-primary text-white'
                    : 'text-foreground-muted hover:text-white'
                  }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-card transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-card transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`flex items-center gap-1 text-sm ${stat.change === 0 ? 'text-foreground-muted' : stat.change > 0 ? 'text-success' : 'text-error'}`}>
                  {stat.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-foreground-muted text-sm mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">User Growth</h2>
              <p className="text-foreground-muted text-sm">New and total users over time</p>
            </div>
            <div className="flex items-center gap-2 text-foreground-muted text-sm">
              <Calendar className="w-4 h-4" />
              Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days
            </div>
          </div>
          <div className="h-80">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Revenue</h2>
              <p className="text-foreground-muted text-sm">Monthly revenue breakdown</p>
            </div>
          </div>
          <div className="h-80">
            <Bar data={revenueChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily usage */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily Usage</h2>
              <p className="text-foreground-muted text-sm">Chat sessions vs image generations</p>
            </div>
          </div>
          <div className="h-80">
            <Bar data={dailyUsageData} options={barChartOptions} />
          </div>
        </div>

        {/* Model usage distribution */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Model Distribution</h2>
            <p className="text-foreground-muted text-sm">Usage by AI model</p>
          </div>
          <div className="h-72">
            <Doughnut data={usageByModelData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Top users table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Top Users</h2>
            <p className="text-foreground-muted text-sm">Most active users this month</p>
          </div>
          <button onClick={() => navigate('/users')} className="text-primary text-sm font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">User</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Plan</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Total Usage</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.length > 0 ? topUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || user.email.split('@')[0]}</p>
                        <p className="text-foreground-muted text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                      {user.subscription_plan || 'Free'}
                    </span>
                  </td>
                  <td className="p-3 text-white">{user.total_usage.toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-foreground-muted">
                    No user data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
