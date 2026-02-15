import { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'banned';
  subscription: string;
  totalUsage: number;
  joinedDate: string;
  avatar?: string;
}

// Mock data
const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', subscription: 'Pro', totalUsage: 15420, joinedDate: '2024-01-15' },
  { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', status: 'active', subscription: 'Enterprise', totalUsage: 28340, joinedDate: '2024-02-20' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'inactive', subscription: 'Free', totalUsage: 1250, joinedDate: '2024-03-10' },
  { id: 4, name: 'Emma Wilson', email: 'emma@example.com', status: 'active', subscription: 'Pro', totalUsage: 9870, joinedDate: '2024-01-28' },
  { id: 5, name: 'Alex Brown', email: 'alex@example.com', status: 'banned', subscription: 'Free', totalUsage: 450, joinedDate: '2024-04-05' },
  { id: 6, name: 'Lisa Davis', email: 'lisa@example.com', status: 'active', subscription: 'Enterprise', totalUsage: 42150, joinedDate: '2023-11-12' },
  { id: 7, name: 'Chris Lee', email: 'chris@example.com', status: 'active', subscription: 'Pro', totalUsage: 7890, joinedDate: '2024-02-08' },
  { id: 8, name: 'Amy Taylor', email: 'amy@example.com', status: 'inactive', subscription: 'Free', totalUsage: 320, joinedDate: '2024-04-22' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
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
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesSubscription = subscriptionFilter === 'all' || user.subscription === subscriptionFilter;
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

  const handleStatusChange = (userId: number, newStatus: 'active' | 'inactive' | 'banned') => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    setActiveDropdown(null);
    toast.success(`User status updated to ${newStatus}`);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted successfully');
    }
    setActiveDropdown(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-success/10 text-success border-success/20',
      inactive: 'bg-warning/10 text-warning border-warning/20',
      banned: 'bg-error/10 text-error border-error/20',
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getSubscriptionBadge = (subscription: string) => {
    const styles = {
      Free: 'bg-card text-foreground-muted',
      Pro: 'bg-primary/10 text-primary',
      Enterprise: 'bg-secondary/10 text-secondary',
    };
    return styles[subscription as keyof typeof styles] || styles.Free;
  };

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
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
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
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-sm text-foreground-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        user.status
                      )}`}
                    >
                      {user.status === 'active' && <Check className="w-3 h-3" />}
                      {user.status === 'banned' && <X className="w-3 h-3" />}
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionBadge(
                        user.subscription
                      )}`}
                    >
                      {user.subscription}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{user.totalUsage.toLocaleString()}</span>
                    <span className="text-foreground-muted text-sm ml-1">words</span>
                  </td>
                  <td className="p-4 text-foreground-muted">
                    {new Date(user.joinedDate).toLocaleDateString()}
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
                            {user.status !== 'active' ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-success hover:bg-success/10 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, 'banned')}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-warning hover:bg-warning/10 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                Ban User
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
