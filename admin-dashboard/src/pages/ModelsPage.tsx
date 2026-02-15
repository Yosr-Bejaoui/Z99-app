import { useState } from 'react';
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
  Mic,
  Check,
  X,
  Key,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIModel {
  id: number;
  name: string;
  provider: string;
  type: 'chat' | 'image' | 'video' | 'audio' | 'tts' | 'stt';
  isActive: boolean;
  isPremium: boolean;
  hasApiKey: boolean;
  usageCount: number;
  description: string;
}

// Mock data
const mockModels: AIModel[] = [
  { id: 1, name: 'GPT-4', provider: 'OpenAI', type: 'chat', isActive: true, isPremium: true, hasApiKey: true, usageCount: 12450, description: 'Most capable GPT-4 model' },
  { id: 2, name: 'GPT-3.5 Turbo', provider: 'OpenAI', type: 'chat', isActive: true, isPremium: false, hasApiKey: true, usageCount: 8920, description: 'Fast and efficient' },
  { id: 3, name: 'Claude 3 Opus', provider: 'Anthropic', type: 'chat', isActive: true, isPremium: true, hasApiKey: true, usageCount: 7140, description: 'Best for complex tasks' },
  { id: 4, name: 'Claude 3 Sonnet', provider: 'Anthropic', type: 'chat', isActive: true, isPremium: false, hasApiKey: true, usageCount: 5230, description: 'Balanced performance' },
  { id: 5, name: 'Gemini Pro', provider: 'Google', type: 'chat', isActive: true, isPremium: false, hasApiKey: true, usageCount: 4870, description: 'Google\'s flagship model' },
  { id: 6, name: 'DALL-E 3', provider: 'OpenAI', type: 'image', isActive: true, isPremium: true, hasApiKey: true, usageCount: 3570, description: 'High quality image generation' },
  { id: 7, name: 'Leonardo', provider: 'Leonardo.ai', type: 'image', isActive: true, isPremium: false, hasApiKey: true, usageCount: 2890, description: 'Creative image generation' },
  { id: 8, name: 'Stable Diffusion', provider: 'Stability AI', type: 'image', isActive: false, isPremium: false, hasApiKey: false, usageCount: 1240, description: 'Open source image model' },
  { id: 9, name: 'DeepSeek', provider: 'DeepSeek', type: 'chat', isActive: true, isPremium: false, hasApiKey: true, usageCount: 2150, description: 'Code-focused AI' },
  { id: 10, name: 'ElevenLabs', provider: 'ElevenLabs', type: 'tts', isActive: true, isPremium: true, hasApiKey: true, usageCount: 1890, description: 'Natural text-to-speech' },
];

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>(mockModels);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get unique providers
  const providers = ['all', ...new Set(models.map((m) => m.provider))];

  // Filter models
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || model.type === typeFilter;
    const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
    return matchesSearch && matchesType && matchesProvider;
  });

  const toggleModelStatus = (modelId: number) => {
    setModels(models.map((m) => (m.id === modelId ? { ...m, isActive: !m.isActive } : m)));
    const model = models.find((m) => m.id === modelId);
    toast.success(`${model?.name} ${model?.isActive ? 'disabled' : 'enabled'}`);
    setActiveDropdown(null);
  };

  const deleteModel = (modelId: number) => {
    if (confirm('Are you sure you want to delete this model?')) {
      setModels(models.filter((m) => m.id !== modelId));
      toast.success('Model deleted successfully');
    }
    setActiveDropdown(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'tts':
        return <Music className="w-4 h-4" />;
      case 'stt':
        return <Mic className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-primary/10 text-primary';
      case 'image':
        return 'bg-secondary/10 text-secondary';
      case 'video':
        return 'bg-accent/10 text-accent';
      case 'audio':
      case 'tts':
      case 'stt':
        return 'bg-success/10 text-success';
      default:
        return 'bg-card text-foreground-muted';
    }
  };

  // Stats
  const stats = {
    total: models.length,
    active: models.filter((m) => m.isActive).length,
    inactive: models.filter((m) => !m.isActive).length,
    premium: models.filter((m) => m.isPremium).length,
  };

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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
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
          <p className="text-foreground-muted text-sm">Premium</p>
          <p className="text-2xl font-bold text-secondary mt-1">{stats.premium}</p>
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
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="tts">Text-to-Speech</option>
            <option value="stt">Speech-to-Text</option>
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
              model.isActive ? 'border-border hover:border-primary/50' : 'border-border opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${getTypeColor(model.type)}`}>
                  {getTypeIcon(model.type)}
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
                          model.isActive
                            ? 'text-warning hover:bg-warning/10'
                            : 'text-success hover:bg-success/10'
                        }`}
                      >
                        {model.isActive ? (
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
              {model.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              {/* Status badges */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  model.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {model.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {model.isActive ? 'Active' : 'Inactive'}
              </span>
              {model.isPremium && (
                <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-secondary/10 text-secondary">
                  Premium
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  model.hasApiKey ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                }`}
              >
                {model.hasApiKey ? <Key className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {model.hasApiKey ? 'API Key Set' : 'No API Key'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-foreground-muted text-sm">Usage</span>
              <span className="text-white font-medium">
                {model.usageCount.toLocaleString()} requests
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
