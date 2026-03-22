import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Bot,
  MessageSquare,
  Image,
  Video,
  Music,
  Check,
  X,
  Key,
  Globe,
  RefreshCw,
  Loader2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { modelsService, AIModel } from '../services/modelsService';
import { parseApiError } from '../utils/parseApiError';

const MODEL_TYPES = [
  { value: 'chat', label: 'Chat' },
  { value: 'text_to_image', label: 'Text to Image' },
  { value: 'image_editor', label: 'Image Editor' },
  { value: 'image_tool', label: 'Image Tool' },
  { value: 'text_to_video', label: 'Text to Video' },
  { value: 'image_to_video', label: 'Image to Video' },
  { value: 'text_or_image_to_video', label: 'Text/Image to Video' },
  { value: 'video_upscaler', label: 'Video Upscaler' },
  { value: 'video_effect', label: 'Video Effect' },
  { value: 'image_to_3d', label: 'Image to 3D' },
  { value: 'text_to_speech', label: 'Text to Speech' },
];

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'wavespeedai', label: 'Wavespeed AI' },
];

interface ModelFormData {
  name: string;
  version: string;
  provider: string;
  model_id: string;
  model_type: string;
  description: string;
  api_key: string;
  base_url: string;
  base_cost: string;
  is_active: boolean;
}

const emptyForm: ModelFormData = {
  name: '',
  version: '1.0',
  provider: 'openai',
  model_id: '',
  model_type: 'chat',
  description: '',
  api_key: '',
  base_url: '',
  base_cost: '0',
  is_active: true,
};

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState<ModelFormData>({ ...emptyForm });
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchModels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await modelsService.getModels();
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Get unique providers
  const providers = ['all', ...new Set(models.map((m) => m.provider))];

  // Filter models
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || model.model_type === typeFilter;
    const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
    return matchesSearch && matchesType && matchesProvider;
  });

  const toggleModelStatus = async (modelId: number) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    try {
      await modelsService.toggleModelStatus(modelId, !model.is_active);
      setModels(models.map((m) => (m.id === modelId ? { ...m, is_active: !m.is_active } : m)));
      toast.success(`${model.name} ${model.is_active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update model status');
    }
    setActiveDropdown(null);
  };

  const deleteModel = async (modelId: number) => {
    if (confirm('Are you sure you want to delete this model?')) {
      try {
        await modelsService.deleteModel(modelId);
        setModels(models.filter((m) => m.id !== modelId));
        toast.success('Model deleted successfully');
      } catch (error) {
        toast.error('Failed to delete model');
      }
    }
    setActiveDropdown(null);
  };

  // --- Form helpers ---
  const updateFormField = (field: keyof ModelFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAddModal = () => {
    setFormData({ ...emptyForm });
    setShowAddModal(true);
  };

  const openEditModal = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name || '',
      version: model.version || '1.0',
      provider: model.provider || 'openai',
      model_id: model.model_id || '',
      model_type: model.model_type || 'chat',
      description: model.description || '',
      api_key: model.api_key || '',
      base_url: model.base_url || '',
      base_cost: String(model.base_cost || 0),
      is_active: model.is_active,
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const openApiKeyModal = (model: AIModel) => {
    setEditingModel(model);
    setApiKeyValue(model.api_key || '');
    setShowApiKeyModal(true);
    setActiveDropdown(null);
  };

  const handleAddModel = async () => {
    if (!formData.name.trim()) {
      toast.error('Model name is required');
      return;
    }
    if (!formData.model_id.trim()) {
      toast.error('Model ID is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        version: formData.version.trim() || '1.0',
        provider: formData.provider,
        model_id: formData.model_id.trim(),
        model_type: formData.model_type,
        description: formData.description.trim(),
        is_active: formData.is_active,
        base_cost: parseFloat(formData.base_cost) || 0,
      };
      if (formData.api_key.trim()) payload.api_key = formData.api_key.trim();
      if (formData.base_url.trim()) payload.base_url = formData.base_url.trim();

      const created = await modelsService.createModel(payload as Partial<AIModel>);
      setModels((prev) => [...prev, created]);
      toast.success('Model created successfully');
      setShowAddModal(false);
      setFormData({ ...emptyForm });
    } catch (error: any) {
      toast.error(parseApiError(error, 'Failed to create model'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditModel = async () => {
    if (!editingModel) return;
    if (!formData.name.trim()) {
      toast.error('Model name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        version: formData.version.trim() || '1.0',
        provider: formData.provider,
        model_id: formData.model_id.trim(),
        model_type: formData.model_type,
        description: formData.description.trim(),
        is_active: formData.is_active,
        base_cost: parseFloat(formData.base_cost) || 0,
      };
      if (formData.api_key.trim()) payload.api_key = formData.api_key.trim();
      if (formData.base_url.trim()) payload.base_url = formData.base_url.trim();

      const updated = await modelsService.updateModel(editingModel.id, payload as Partial<AIModel>);
      setModels((prev) => prev.map((m) => (m.id === editingModel.id ? updated : m)));
      toast.success('Model updated successfully');
      setShowEditModal(false);
      setEditingModel(null);
    } catch (error: any) {
      toast.error(parseApiError(error, 'Failed to update model'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!editingModel) return;

    setSaving(true);
    try {
      const updated = await modelsService.updateModel(editingModel.id, { api_key: apiKeyValue.trim() } as Partial<AIModel>);
      setModels((prev) => prev.map((m) => (m.id === editingModel.id ? updated : m)));
      toast.success('API key updated successfully');
      setShowApiKeyModal(false);
      setEditingModel(null);
      setApiKeyValue('');
    } catch {
      toast.error('Failed to update API key');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'text_to_image':
      case 'image_editor':
      case 'image_tool':
        return <Image className="w-4 h-4" />;
      case 'text_to_video':
      case 'image_to_video':
      case 'text_or_image_to_video':
      case 'video_upscaler':
      case 'video_effect':
        return <Video className="w-4 h-4" />;
      case 'text_to_speech':
        return <Music className="w-4 h-4" />;
      case 'image_to_3d':
        return <Bot className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-primary/10 text-primary';
      case 'text_to_image':
      case 'image_editor':
      case 'image_tool':
        return 'bg-secondary/10 text-secondary';
      case 'text_to_video':
      case 'image_to_video':
      case 'text_or_image_to_video':
      case 'video_upscaler':
      case 'video_effect':
        return 'bg-accent/10 text-accent';
      case 'text_to_speech':
        return 'bg-success/10 text-success';
      case 'image_to_3d':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-card text-foreground-muted';
    }
  };

  // --- Reusable form fields renderer ---
  const renderFormFields = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">Model Name *</label>
          <input
            type="text"
            placeholder="e.g., GPT-4 Turbo"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Model ID *</label>
          <input
            type="text"
            placeholder="e.g., gpt-4-turbo"
            value={formData.model_id}
            onChange={(e) => updateFormField('model_id', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => updateFormField('provider', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Type</label>
          <select
            value={formData.model_type}
            onChange={(e) => updateFormField('model_type', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            {MODEL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Version</label>
          <input
            type="text"
            placeholder="e.g., 1.0"
            value={formData.version}
            onChange={(e) => updateFormField('version', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Description</label>
        <textarea
          placeholder="Brief description of the model..."
          value={formData.description}
          onChange={(e) => updateFormField('description', e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">API Key</label>
          <input
            type="password"
            placeholder="sk-..."
            value={formData.api_key}
            onChange={(e) => updateFormField('api_key', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Base Cost (credits)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={formData.base_cost}
            onChange={(e) => updateFormField('base_cost', e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Base URL (optional)</label>
        <input
          type="url"
          placeholder="https://api.example.com/v1"
          value={formData.base_url}
          onChange={(e) => updateFormField('base_url', e.target.value)}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => updateFormField('is_active', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-card border border-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm text-white">Active</span>
      </div>
    </div>
  );

  // Stats
  const stats = {
    total: models.length,
    active: models.filter((m) => m.is_active).length,
    inactive: models.filter((m) => !m.is_active).length,
    chat: models.filter((m) => m.model_type === 'chat').length,
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
          <h1 className="text-2xl font-bold text-white">AI Models</h1>
          <p className="text-foreground-muted mt-1">
            Manage and configure AI model integrations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchModels(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-white rounded-xl hover:bg-surface transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-foreground-muted text-sm">Total Models</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-foreground-muted text-sm">Active</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.active}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-foreground-muted text-sm">Inactive</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-foreground-muted text-sm">Chat Models</p>
          <p className="text-2xl font-bold text-secondary mt-1">{stats.chat}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Types</option>
            {MODEL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Provider filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors cursor-pointer"
          >
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider === 'all' ? 'All Providers' : provider}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Models grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`bg-surface border rounded-2xl p-5 transition-all ${model.is_active ? 'border-border hover:border-primary/50' : 'border-border opacity-60'
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${getTypeColor(model.model_type)}`}>
                  {getTypeIcon(model.model_type)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{model.name}</h3>
                  <p className="text-foreground-muted text-sm">{model.provider}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === model.id ? null : model.id)}
                  className="p-2 rounded-lg hover:bg-card transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-foreground-muted" />
                </button>

                {activeDropdown === model.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => openEditModal(model)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Model
                      </button>
                      <button
                        onClick={() => openApiKeyModal(model)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Update API Key
                      </button>
                      <button
                        onClick={() => toggleModelStatus(model.id)}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${model.is_active
                            ? 'text-warning hover:bg-warning/10'
                            : 'text-success hover:bg-success/10'
                          }`}
                      >
                        {model.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Enable
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteModel(model.id)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-foreground-muted text-sm mb-4 line-clamp-2">
              {model.description || 'No description available'}
            </p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Status badges */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${model.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}
              >
                {model.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {model.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-card text-foreground-muted">
                v{model.version}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${model.api_key ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                  }`}
              >
                {model.api_key ? <Key className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {model.api_key ? 'API Key Set' : 'No API Key'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-foreground-muted text-sm">Base Cost</span>
              <span className="text-white font-medium">
                {parseFloat(Number(model.base_cost || 0).toFixed(6))} credits
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted">No models found matching your criteria</p>
        </div>
      )}

      {/* ==================== ADD MODEL MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Add New AI Model</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-card transition-colors">
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {renderFormFields()}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModel}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Creating...' : 'Add Model'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODEL MODAL ==================== */}
      {showEditModal && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Edit Model — {editingModel.name}</h2>
              <button onClick={() => { setShowEditModal(false); setEditingModel(null); }} className="p-1 rounded-lg hover:bg-card transition-colors">
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {renderFormFields()}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => { setShowEditModal(false); setEditingModel(null); }}
                className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditModel}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UPDATE API KEY MODAL ==================== */}
      {showApiKeyModal && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Update API Key</h2>
              <button onClick={() => { setShowApiKeyModal(false); setEditingModel(null); }} className="p-1 rounded-lg hover:bg-card transition-colors">
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <p className="text-foreground-muted text-sm mb-4">
              Updating API key for <span className="text-white font-medium">{editingModel.name}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-white mb-1">API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => { setShowApiKeyModal(false); setEditingModel(null); }}
                className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApiKey}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {saving ? 'Updating...' : 'Update Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
