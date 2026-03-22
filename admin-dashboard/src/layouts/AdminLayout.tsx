import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bot,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/models', icon: Bot, label: 'AI Models' },
  { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AD';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-surface border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Logo size={32} className="flex-shrink-0" />
            {sidebarOpen && (
              <span className="font-semibold text-lg text-white">AI Admin</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-card transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground-muted" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-muted hover:bg-card hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className={`w-5 h-5 ${!sidebarOpen && 'mx-auto'}`} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-foreground-muted hover:bg-error/10 hover:text-error transition-all`}
          >
            <LogOut className={`w-5 h-5 ${!sidebarOpen && 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
            >
              <Menu className="w-6 h-6 text-foreground-muted" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-card transition-colors">
                <Bell className="w-5 h-5 text-foreground-muted" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-card transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {user?.is_superuser ? 'Super Admin' : 'Admin'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-foreground-muted hidden sm:block" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <NavLink
                          to="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white rounded-lg transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
