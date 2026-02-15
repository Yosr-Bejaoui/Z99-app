import { useState } from 'react';
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
  Calendar,
  Download,
} from 'lucide-react';

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
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'New Users',
        data: [1200, 1900, 2400, 2100, 2800, 3200, 3800],
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Total Users',
        data: [5000, 6900, 9300, 11400, 14200, 17400, 21200],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [12500, 18900, 24400, 21100, 28800, 32200, 38800],
        backgroundColor: '#2dd4bf',
        borderRadius: 8,
      },
    ],
  };

  const usageByModelData = {
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

  const dailyUsageData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Chat Sessions',
        data: [4200, 5100, 4800, 6200, 5900, 3800, 3200],
        backgroundColor: '#2dd4bf',
        borderRadius: 8,
      },
      {
        label: 'Image Generations',
        data: [1800, 2200, 2100, 2800, 2500, 1900, 1600],
        backgroundColor: '#8b5cf6',
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

  // Stats summary
  const stats = [
    { label: 'Total Users', value: '21,247', change: '+12.5%', icon: Users, color: 'text-primary' },
    { label: 'Chat Sessions', value: '148,293', change: '+23.1%', icon: MessageSquare, color: 'text-secondary' },
    { label: 'Images Generated', value: '45,847', change: '+8.4%', icon: Image, color: 'text-accent' },
    { label: 'Total Revenue', value: '$176,700', change: '+18.2%', icon: DollarSign, color: 'text-success' },
  ];

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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'text-foreground-muted hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-card transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
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
            <Bar data={revenueData} options={barChartOptions} />
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
          <button className="text-primary text-sm font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">User</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Plan</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Chat Sessions</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Images</th>
                <th className="text-left p-3 text-sm font-medium text-foreground-muted">Words Used</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Sarah Smith', email: 'sarah@example.com', plan: 'Enterprise', chats: 1245, images: 423, words: 284500 },
                { name: 'John Doe', email: 'john@example.com', plan: 'Pro', chats: 892, images: 156, words: 154200 },
                { name: 'Emma Wilson', email: 'emma@example.com', plan: 'Pro', chats: 756, images: 289, words: 98700 },
                { name: 'Alex Brown', email: 'alex@example.com', plan: 'Enterprise', chats: 645, images: 512, words: 87300 },
                { name: 'Lisa Davis', email: 'lisa@example.com', plan: 'Pro', chats: 534, images: 98, words: 76400 },
              ].map((user, index) => (
                <tr key={index} className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-foreground-muted text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      user.plan === 'Enterprise' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-3 text-white">{user.chats.toLocaleString()}</td>
                  <td className="p-3 text-white">{user.images.toLocaleString()}</td>
                  <td className="p-3 text-white">{user.words.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
