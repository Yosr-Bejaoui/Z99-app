import { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  MessageSquare,
  Image,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  MoreVertical,
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
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Mock data for charts
  const usageChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Chat Sessions',
        data: [1200, 1900, 2400, 2100, 2800, 3200, 3800],
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Images Generated',
        data: [800, 1100, 1400, 1200, 1600, 1900, 2200],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const modelUsageData = {
    labels: ['ChatGPT', 'Claude', 'Gemini', 'DALL-E', 'Leonardo', 'Others'],
    datasets: [
      {
        data: [35, 25, 20, 10, 7, 3],
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
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
          <ArrowUpRight className="w-4 h-4" />
          View Reports
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="12,847"
          change={12.5}
          icon={Users}
          color="bg-primary"
        />
        <StatCard
          title="Active Subscriptions"
          value="3,284"
          change={8.2}
          icon={CreditCard}
          color="bg-secondary"
        />
        <StatCard
          title="Chat Sessions"
          value="48,293"
          change={23.1}
          icon={MessageSquare}
          color="bg-accent"
        />
        <StatCard
          title="Images Generated"
          value="15,847"
          change={-5.4}
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
            {[
              { name: 'GPT-4', provider: 'OpenAI', usage: 12450, percentage: 35 },
              { name: 'Claude 3', provider: 'Anthropic', usage: 8920, percentage: 25 },
              { name: 'Gemini Pro', provider: 'Google', usage: 7140, percentage: 20 },
              { name: 'DALL-E 3', provider: 'OpenAI', usage: 3570, percentage: 10 },
              { name: 'Leonardo', provider: 'Leonardo.ai', usage: 2499, percentage: 7 },
            ].map((model) => (
              <div key={model.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-white font-medium">{model.name}</span>
                      <span className="text-xs text-foreground-muted ml-2">{model.provider}</span>
                    </div>
                    <span className="text-sm text-foreground-muted">
                      {model.usage.toLocaleString()} uses
                    </span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
