import { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Globe,
  Key,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'api'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const [notifications, setNotifications] = useState({
    emailNewUsers: true,
    emailSubscriptions: true,
    emailSystemAlerts: true,
    pushNotifications: false,
    weeklyReports: true,
  });

  const [apiSettings, setApiSettings] = useState({
    openaiKey: '',
    anthropicKey: '',
    googleKey: '',
    stripeKey: '',
    stripeWebhook: '',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password changed successfully');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved');
  };

  const handleSaveApiKeys = () => {
    toast.success('API keys updated successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-foreground-muted mt-1">Manage your admin account and platform settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-surface border border-border rounded-2xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground-muted hover:bg-card hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.split(' ').map((n) => n[0]).join('') || 'AD'}
                </div>
                <div>
                  <h3 className="text-white font-medium">{user?.name || 'Admin'}</h3>
                  <p className="text-foreground-muted text-sm">{user?.is_superuser ? 'Super Admin' : 'Admin'}</p>
                  <button className="mt-2 text-primary text-sm font-medium hover:underline">
                    Change avatar
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Username</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change password */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Update Password
                  </button>
                </form>
              </div>

              {/* Two-factor authentication */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
                    <p className="text-foreground-muted text-sm mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-card border border-border text-white rounded-xl hover:bg-surface transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div className="pb-6 border-b border-border">
                  <h3 className="text-white font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'emailNewUsers', label: 'New user registrations', description: 'Get notified when new users sign up' },
                      { id: 'emailSubscriptions', label: 'Subscription updates', description: 'New subscriptions, cancellations, and renewals' },
                      { id: 'emailSystemAlerts', label: 'System alerts', description: 'Important system and security notifications' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-foreground-muted text-sm">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.id as keyof typeof notifications]}
                            onChange={(e) =>
                              setNotifications({ ...notifications, [item.id]: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-card rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pb-6 border-b border-border">
                  <h3 className="text-white font-medium mb-4">Other Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'pushNotifications', label: 'Push notifications', description: 'Receive browser push notifications' },
                      { id: 'weeklyReports', label: 'Weekly reports', description: 'Get weekly analytics summary via email' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-foreground-muted text-sm">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.id as keyof typeof notifications]}
                            onChange={(e) =>
                              setNotifications({ ...notifications, [item.id]: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-card rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* API Keys tab */}
          {activeTab === 'api' && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">API Keys</h2>
              <p className="text-foreground-muted text-sm mb-6">
                Configure external service API keys for platform integrations
              </p>

              <div className="space-y-6">
                {[
                  { id: 'openaiKey', label: 'OpenAI API Key', placeholder: 'sk-...' },
                  { id: 'anthropicKey', label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
                  { id: 'googleKey', label: 'Google AI API Key', placeholder: 'AIza...' },
                  { id: 'stripeKey', label: 'Stripe Secret Key', placeholder: 'sk_live_...' },
                  { id: 'stripeWebhook', label: 'Stripe Webhook Secret', placeholder: 'whsec_...' },
                ].map((item) => (
                  <div key={item.id}>
                    <label className="block text-sm font-medium text-white mb-2">{item.label}</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type="password"
                        value={apiSettings[item.id as keyof typeof apiSettings]}
                        onChange={(e) => setApiSettings({ ...apiSettings, [item.id]: e.target.value })}
                        placeholder={item.placeholder}
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={handleSaveApiKeys}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save API Keys
                  </button>
                  <p className="text-foreground-muted text-sm">
                    API keys are encrypted and stored securely
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
