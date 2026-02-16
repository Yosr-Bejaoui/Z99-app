import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Mail,
  Shield,
  Ban,
  Check,
  X,
  ShieldPlus,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  subscribed: boolean;
  total_token_used: number;
  date_joined: string;
  credits_balance: number;
  session_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts/admin/users/');
      const data = response.data.results || response.data || [];
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add Admin form submission
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (adminForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setAdminFormLoading(true);
    try {
      await api.post('/accounts/admin/create/', {
        email: adminForm.email,
        username: adminForm.username,
        password: adminForm.password,
        is_staff: true,
        is_superuser: true,
      });
      toast.success('Admin user created successfully!');
      setShowAddAdminModal(false);
      setAdminForm({ email: '', username: '', password: '', confirmPassword: '' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; error?: string } } };
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to create admin');
    } finally {
      setAdminFormLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    const matchesSubscription = subscriptionFilter === 'all' || 
      (subscriptionFilter === 'subscribed' && user.subscribed) ||
      (subscriptionFilter === 'free' && !user.subscribed);
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: boolean) => {
    try {
      await api.post(`/accounts/admin/users/${userId}/toggle_status/`);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u)));
      setActiveDropdown(null);
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/accounts/admin/users/${userId}/`);
        setUsers(users.filter((u) => u.id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
    setActiveDropdown(null);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-success/10 text-success border-success/20'
      : 'bg-warning/10 text-warning border-warning/20';
  };

  const getSubscriptionBadge = (subscribed: boolean) => {
    return subscribed 
      ? 'bg-primary/10 text-primary'
      : 'bg-card text-foreground-muted';
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
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-foreground-muted mt-1">
            Manage {filteredUsers.length} registered users
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl hover:bg-secondary/80 transition-colors w-fit"
          >
            <ShieldPlus className="w-4 h-4" />
            Add Admin
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors w-fit">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <ShieldPlus className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Add New Admin</h2>
                  <p className="text-sm text-foreground-muted">Create a new administrator account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  placeholder="adminuser"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-secondary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-secondary transition-colors"
                />
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white font-medium">Admin Privileges</p>
                    <p className="text-foreground-muted mt-1">
                      This user will have full access to the admin dashboard including user management, 
                      settings, and all administrative functions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminFormLoading}
                  className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {adminFormLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ShieldPlus className="w-4 h-4" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-foreground-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* Subscription filter */}
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="subscribed">Subscribed</option>
            <option value="free">Free</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-foreground-muted">
              {selectedUsers.length} selected
            </span>
            <button
              onClick={() => toast.success('Bulk email sent')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button
              onClick={() => {
                if (confirm('Ban all selected users?')) {
                  setUsers(
                    users.map((u) =>
                      selectedUsers.includes(u.id) ? { ...u, status: 'banned' as const } : u
                    )
                  );
                  setSelectedUsers([]);
                  toast.success('Users banned');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Ban Users
            </button>
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">User</th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Status</th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Plan</th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Total Usage</th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Joined</th>
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-card/50 transition-colors"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                        {(user.username || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.username || 'No username'}</p>
                        <p className="text-sm text-foreground-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        user.is_active
                      )}`}
                    >
                      {user.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionBadge(
                        user.subscribed
                      )}`}
                    >
                      {user.subscribed ? 'Subscribed' : 'Free'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{Number(user.total_token_used || 0).toLocaleString()}</span>
                    <span className="text-foreground-muted text-sm ml-1">tokens</span>
                  </td>
                  <td className="p-4 text-foreground-muted">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                        className="p-2 rounded-lg hover:bg-card transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-foreground-muted" />
                      </button>

                      {activeDropdown === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                            <button
                              onClick={() => toast.success('Edit user modal would open')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit User
                            </button>
                            <button
                              onClick={() => toast.success('Email sent')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Send Email
                            </button>
                            {!user.is_active ? (
                              <button
                                onClick={() => handleStatusChange(user.id, true)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-success hover:bg-success/10 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, false)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-warning hover:bg-warning/10 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-foreground-muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
            users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-foreground-muted" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'text-foreground-muted hover:bg-card'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
