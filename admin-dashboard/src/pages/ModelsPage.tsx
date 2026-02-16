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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { modelsService, AIModel } from '../services/modelsService';

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
            onClick={() => setShowAddModal(true)}
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
            <option value="chat">Chat</option>
            <option value="text_to_image">Text to Image</option>
            <option value="image_editor">Image Editor</option>
            <option value="image_tool">Image Tool</option>
            <option value="text_to_video">Text to Video</option>
            <option value="image_to_video">Image to Video</option>
            <option value="video_upscaler">Video Upscaler</option>
            <option value="video_effect">Video Effect</option>
            <option value="image_to_3d">Image to 3D</option>
            <option value="text_to_speech">Text to Speech</option>
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
            className={`bg-surface border rounded-2xl p-5 transition-all ${
              model.is_active ? 'border-border hover:border-primary/50' : 'border-border opacity-60'
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
                        onClick={() => {
                          toast.success('Edit modal would open');
                          setActiveDropdown(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Model
                      </button>
                      <button
                        onClick={() => {
                          toast.success('API key modal would open');
                          setActiveDropdown(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-white transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Update API Key
                      </button>
                      <button
                        onClick={() => toggleModelStatus(model.id)}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                          model.is_active
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

            <div className="flex items-center gap-2 mb-4">
              {/* Status badges */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  model.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {model.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {model.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-card text-foreground-muted">
                v{model.version}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  model.api_key ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                }`}
              >
                {model.api_key ? <Key className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {model.api_key ? 'API Key Set' : 'No API Key'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-foreground-muted text-sm">Base Cost</span>
              <span className="text-white font-medium">
                {model.base_cost || 0} credits
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

      {/* Add Model Modal (placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Add New AI Model</h2>
            <p className="text-foreground-muted mb-6">
              Configure a new AI model integration for your platform.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g., GPT-4 Turbo"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Provider</label>
                <input
                  type="text"
                  placeholder="e.g., OpenAI"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Type</label>
                <select className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white focus:border-primary transition-colors">
                  <option value="chat">Chat</option>
                  <option value="image">Image Generation</option>
                  <option value="video">Video Generation</option>
                  <option value="tts">Text-to-Speech</option>
                  <option value="stt">Speech-to-Text</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-white placeholder:text-foreground-muted focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Model would be created');
                  setShowAddModal(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
              >
                Add Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
