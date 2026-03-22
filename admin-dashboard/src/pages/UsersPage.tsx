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
  CreditCard,
  Activity,
  History,
  Wallet,
  Key,
  Crown,
  Calendar,
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
  const [roleFilter, setRoleFilter] = useState<string>('all');
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

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
    subscribed: false,
    credits_balance: 0,
  });

  // User Details Modal State
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [detailsTab, setDetailsTab] = useState<'purchases' | 'usage'>('purchases');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userPurchases, setUserPurchases] = useState<Array<{
    id: number;
    plan_name: string;
    amount: string;
    status: string;
    payment_method: string;
    created_at: string;
  }>>([]);
  const [userUsage, setUserUsage] = useState<{
    chat_sessions: number;
    total_messages: number;
    total_credits_used: number;
    total_token_used: number;
    transactions: Array<{
      id: number;
      amount: number;
      type: string;
      description: string;
      created_at: string;
    }>;
  } | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Array<{
    id: number;
    name: string;
    plan_code: string;
    description: string;
    words_or_credits: number;
    amount: string;
  }>>([]);

  // Add Credits Modal State
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [addCreditsUser, setAddCreditsUser] = useState<User | null>(null);
  const [addCreditsAmount, setAddCreditsAmount] = useState('');
  const [addCreditsReason, setAddCreditsReason] = useState('Admin credit adjustment');
  const [addCreditsLoading, setAddCreditsLoading] = useState(false);

  // Assign Plan Modal State
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [assignPlanUser, setAssignPlanUser] = useState<User | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('monthly');
  const [assignPlanLoading, setAssignPlanLoading] = useState(false);

  // Reset Password Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

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

  // Fetch available plans
  const fetchPlans = async () => {
    try {
      const response = await api.get('/accounts/admin/users/plans/');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  // Handle Add Credits
  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCreditsUser) return;

    const amount = parseInt(addCreditsAmount);
    if (isNaN(amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    setAddCreditsLoading(true);
    try {
      await api.post(`/accounts/admin/users/${addCreditsUser.id}/set_credits/`, {
        amount: amount,
        reason: addCreditsReason,
      });
      toast.success('Credits updated successfully');
      setShowAddCreditsModal(false);
      setAddCreditsAmount('');
      setAddCreditsReason('Admin credit adjustment');
      fetchUsers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update credits';
      toast.error(errorMsg);
      console.error('Set credits error:', error.response?.data);
    } finally {
      setAddCreditsLoading(false);
    }
  };

  // Handle Assign Plan
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPlanUser || !selectedPlanId) {
      toast.error('Please select a plan');
      return;
    }

    setAssignPlanLoading(true);
    try {
      await api.post(`/accounts/admin/users/${assignPlanUser.id}/assign_plan/`, {
        plan_id: selectedPlanId,
        duration_type: selectedDuration,
      });
      toast.success('Plan assigned successfully');
      setShowAssignPlanModal(false);
      setSelectedPlanId(null);
      setSelectedDuration('monthly');
      fetchUsers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to assign plan';
      toast.error(errorMsg);
      console.error('Assign plan error:', error.response?.data);
    } finally {
      setAssignPlanLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setResetPasswordLoading(true);
    try {
      await api.post(`/accounts/admin/users/${resetPasswordUser.id}/reset_password/`, {
        new_password: newPassword,
      });
      toast.success('Password reset successfully');
      setShowResetPasswordModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMsg);
      console.error('Reset password error:', error.response?.data);
    } finally {
      setResetPasswordLoading(false);
    }
  };

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

  // Handle Add User form submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userForm.password !== userForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (userForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setUserFormLoading(true);
    try {
      await api.post('/accounts/register/', {
        email: userForm.email,
        username: userForm.username,
        password: userForm.password,
        confirm_password: userForm.confirmPassword,
      });
      toast.success('User created successfully! Verification email sent.');
      setShowAddUserModal(false);
      setUserForm({ email: '', username: '', password: '', confirmPassword: '' });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const data = err.response?.data;
      let errorMsg = 'Failed to create user';

      if (data) {
        // Handle various error formats
        if (typeof data.detail === 'string') errorMsg = data.detail;
        else if (typeof data.error === 'string') errorMsg = data.error;
        else if (Array.isArray(data.email)) errorMsg = data.email[0] as string;
        else if (Array.isArray(data.username)) errorMsg = data.username[0] as string;
        else if (Array.isArray(data.password)) errorMsg = data.password[0] as string;
        else if (Array.isArray(data.confirm_password)) errorMsg = data.confirm_password[0] as string;
        else if (typeof data.non_field_errors === 'object' && Array.isArray(data.non_field_errors)) {
          errorMsg = data.non_field_errors[0] as string;
        }
      }

      toast.error(errorMsg);
    } finally {
      setUserFormLoading(false);
    }
  };

  // Handle opening edit modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      email: user.email || '',
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff,
      subscribed: user.subscribed || false,
      credits_balance: user.credits_balance || 0,
    });
    setShowEditUserModal(true);
    setActiveDropdown(null);
  };

  // Handle Edit User form submission
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditUserLoading(true);
    try {
      await api.patch(`/accounts/admin/users/${editingUser.id}/`, editUserForm);
      toast.success('User updated successfully!');
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const data = err.response?.data;
      let errorMsg = 'Failed to update user';

      if (data) {
        if (typeof data.detail === 'string') errorMsg = data.detail;
        else if (typeof data.error === 'string') errorMsg = data.error;
      }

      toast.error(errorMsg);
    } finally {
      setEditUserLoading(false);
    }
  };

  // Handle opening user details modal
  const handleOpenDetailsModal = async (user: User) => {
    setDetailsUser(user);
    setShowUserDetailsModal(true);
    setDetailsTab('purchases');
    setDetailsLoading(true);
    setActiveDropdown(null);

    try {
      const [purchasesRes, usageRes] = await Promise.all([
        api.get(`/accounts/admin/users/${user.id}/purchases/`),
        api.get(`/accounts/admin/users/${user.id}/usage/`),
      ]);
      setUserPurchases(purchasesRes.data);
      setUserUsage(usageRes.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setDetailsLoading(false);
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
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'admin' && user.is_staff) ||
      (roleFilter === 'user' && !user.is_staff);
    return matchesSearch && matchesStatus && matchesSubscription && matchesRole;
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
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors w-fit"
          >
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Add New User</h2>
                  <p className="text-sm text-foreground-muted">Create a new user account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="username"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="e.g. Password1"
                    className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white transition-colors"
                  >
                    {showUserPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-foreground-muted mt-1">Min 8 chars, uppercase, lowercase, digit</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Confirm Password
                </label>
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  required
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormLoading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {userFormLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit User</h2>
                  <p className="text-sm text-foreground-muted">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editUserForm.first_name}
                    onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editUserForm.last_name}
                    onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Credits Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={editUserForm.credits_balance}
                  onChange={(e) => setEditUserForm({ ...editUserForm, credits_balance: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.is_active}
                    onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-card accent-success"
                  />
                  <span className="text-sm text-foreground-muted">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.is_staff}
                    onChange={(e) => setEditUserForm({ ...editUserForm, is_staff: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-card accent-secondary"
                  />
                  <span className="text-sm text-foreground-muted">Admin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.subscribed}
                    onChange={(e) => setEditUserForm({ ...editUserForm, subscribed: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-card accent-primary"
                  />
                  <span className="text-sm text-foreground-muted">Subscribed</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editUserLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
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

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Normal Users</option>
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
      <div className="bg-surface border border-border rounded-2xl">
        <div>
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
                <th className="p-4 text-left text-sm font-medium text-foreground-muted">Role</th>
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.is_staff
                        ? 'bg-secondary/10 text-secondary border border-secondary/20'
                        : 'bg-card text-foreground-muted'
                        }`}
                    >
                      {user.is_staff ? (
                        <>
                          <Shield className="w-3 h-3" />
                          Admin
                        </>
                      ) : (
                        'User'
                      )}
                    </span>
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
                  <td className="p-4 overflow-visible">
                    <div className="relative" style={{ overflow: 'visible' }}>
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
                          <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-[100] animate-fade-in max-h-[400px] overflow-y-auto">
                            <div className="px-3 py-2 border-b border-border">
                              <p className="text-xs text-foreground-muted font-medium">ACTIONS</p>
                            </div>
                            <button
                              onClick={() => handleOpenDetailsModal(user)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Activity className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Profile
                            </button>
                            <div className="px-3 py-2 border-t border-b border-border">
                              <p className="text-xs text-foreground-muted font-medium">CREDITS & PLANS</p>
                            </div>
                            <button
                              onClick={() => {
                                setAddCreditsUser(user);
                                setAddCreditsAmount(String(user.credits_balance || 0));
                                setShowAddCreditsModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Wallet className="w-4 h-4" />
                              Manage Credits
                            </button>
                            <button
                              onClick={() => {
                                setAssignPlanUser(user);
                                setShowAssignPlanModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Crown className="w-4 h-4" />
                              Assign Plan
                            </button>
                            <div className="px-3 py-2 border-t border-b border-border">
                              <p className="text-xs text-foreground-muted font-medium">SECURITY</p>
                            </div>
                            <button
                              onClick={() => {
                                setResetPasswordUser(user);
                                setShowResetPasswordModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Key className="w-4 h-4" />
                              Reset Password
                            </button>
                            {!user.is_active ? (
                              <button
                                onClick={() => handleStatusChange(user.id, true)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-success hover:bg-success/10 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Activate Account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, false)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-warning hover:bg-warning/10 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                Deactivate Account
                              </button>
                            )}
                            <div className="border-t border-border">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
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
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
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

      {/* User Details Modal */}
      {showUserDetailsModal && detailsUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{detailsUser.username || detailsUser.email}</h2>
                  <p className="text-sm text-foreground-muted">{detailsUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-foreground-muted mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs">Credits Balance</span>
                </div>
                <p className="text-xl font-bold text-white">{detailsUser.credits_balance?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-foreground-muted mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Tokens Used</span>
                </div>
                <p className="text-xl font-bold text-white">{detailsUser.total_token_used?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-foreground-muted mb-1">
                  <History className="w-4 h-4" />
                  <span className="text-xs">Sessions</span>
                </div>
                <p className="text-xl font-bold text-white">{detailsUser.session_count || 0}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDetailsTab('purchases')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${detailsTab === 'purchases'
                  ? 'bg-primary text-white'
                  : 'bg-card text-foreground-muted hover:text-white'
                  }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Purchases
              </button>
              <button
                onClick={() => setDetailsTab('usage')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${detailsTab === 'usage'
                  ? 'bg-primary text-white'
                  : 'bg-card text-foreground-muted hover:text-white'
                  }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Usage & Transactions
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : detailsTab === 'purchases' ? (
                <div className="space-y-3">
                  {userPurchases.length === 0 ? (
                    <div className="text-center py-8 text-foreground-muted">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No purchases found</p>
                    </div>
                  ) : (
                    userPurchases.map((purchase) => (
                      <div key={purchase.id} className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{purchase.plan_name}</p>
                            <p className="text-sm text-foreground-muted">
                              {new Date(purchase.created_at).toLocaleDateString()} • {purchase.payment_method}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">${purchase.amount}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${purchase.status === 'completed' || purchase.status === 'paid'
                              ? 'bg-success/20 text-success'
                              : purchase.status === 'pending'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-error/20 text-error'
                              }`}>
                              {purchase.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Usage Stats */}
                  {userUsage && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card rounded-xl p-4 border border-border">
                          <p className="text-foreground-muted text-sm">Chat Sessions</p>
                          <p className="text-2xl font-bold text-white">{userUsage.chat_sessions}</p>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border">
                          <p className="text-foreground-muted text-sm">Total Messages</p>
                          <p className="text-2xl font-bold text-white">{userUsage.total_messages}</p>
                        </div>
                      </div>

                      {/* Transactions */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground-muted mb-3">Recent Transactions</h4>
                        {userUsage.transactions.length === 0 ? (
                          <div className="text-center py-6 text-foreground-muted">
                            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No transactions found</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {userUsage.transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                                <div>
                                  <p className="text-sm text-white">{tx.description || 'Transaction'}</p>
                                  <p className="text-xs text-foreground-muted">
                                    {new Date(tx.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <span className={`font-medium ${tx.type === 'credit' ? 'text-success' : 'text-error'
                                  }`}>
                                  {tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowUserDetailsModal(false);
                  handleOpenEditModal(detailsUser);
                }}
                className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit User
              </button>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Set Credits Modal */}
      {showAddCreditsModal && addCreditsUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Manage Credits</h2>
                  <p className="text-sm text-foreground-muted">{addCreditsUser.username || addCreditsUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCreditsModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground-muted mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-primary">{(addCreditsUser.credits_balance || 0).toLocaleString()}</p>
            </div>

            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  New Credit Balance
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addCreditsAmount}
                  onChange={(e) => setAddCreditsAmount(e.target.value)}
                  placeholder="Enter new credit amount"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-success transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={addCreditsReason}
                  onChange={(e) => setAddCreditsReason(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-success transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddCreditsAmount(String((addCreditsUser.credits_balance || 0) + 100))}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground-muted hover:text-white transition-colors"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setAddCreditsAmount(String((addCreditsUser.credits_balance || 0) + 500))}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground-muted hover:text-white transition-colors"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => setAddCreditsAmount(String((addCreditsUser.credits_balance || 0) + 1000))}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground-muted hover:text-white transition-colors"
                >
                  +1000
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCreditsModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCreditsLoading}
                  className="flex-1 px-4 py-3 bg-success text-white rounded-xl hover:bg-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addCreditsLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssignPlanModal && assignPlanUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Assign Plan</h2>
                  <p className="text-sm text-foreground-muted">{assignPlanUser.username || assignPlanUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignPlanModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-3">
                  Select Plan
                </label>
                <div className="grid gap-3">
                  {plans.length === 0 ? (
                    <p className="text-foreground-muted text-center py-4">No plans available</p>
                  ) : (
                    plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedPlanId === plan.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border hover:border-foreground-muted'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={selectedPlanId === plan.id}
                            onChange={() => setSelectedPlanId(plan.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <div>
                            <p className="font-medium text-white">{plan.name}</p>
                            <p className="text-sm text-foreground-muted">
                              {plan.words_or_credits.toLocaleString()} credits
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-primary">${plan.amount}</p>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Duration
                </label>
                <div className="flex gap-3">
                  {['weekly', 'monthly', 'yearly'].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setSelectedDuration(duration)}
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${selectedDuration === duration
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-foreground-muted hover:text-white'
                        }`}
                    >
                      {duration.charAt(0).toUpperCase() + duration.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card/50 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white font-medium">Plan will be activated immediately</p>
                    <p className="text-foreground-muted mt-1">
                      Credits from the plan will be added to the user's balance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssignPlanModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignPlanLoading || !selectedPlanId}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assignPlanLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Assign Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Reset Password</h2>
                  <p className="text-sm text-foreground-muted">{resetPasswordUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-warning transition-colors"
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
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Confirm Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-warning transition-colors"
                />
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white font-medium">Security Notice</p>
                    <p className="text-foreground-muted mt-1">
                      The user will need to use this new password to log in. Consider informing them via email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="flex-1 px-4 py-3 bg-card border border-border text-white rounded-xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading}
                  className="flex-1 px-4 py-3 bg-warning text-white rounded-xl hover:bg-warning/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetPasswordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
