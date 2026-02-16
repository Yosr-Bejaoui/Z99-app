// User Types
export interface Subscription {
  id: number;
  plan?: {
    id: number;
    name: string;
    price: number;
    word_limit: number;
    image_limit: number;
  };
  status: string;
  start_date: string;
  end_date: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  profile_picture?: string;
  profile_image?: string;
  subscribed: boolean;
  api_limit: number;
  total_token_used: number;
  total_words_used?: number;
  total_images_generated?: number;
  credits?: number;
  subscription?: Subscription;
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  name?: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterResponse extends AuthTokens {
  user: User;
  message?: string;
}

// AI Model Types
export type ModelType = 
  | 'chat'
  | 'text_to_image'
  | 'text_to_video'
  | 'image_to_video'
  | 'text_or_image_to_video'
  | 'image_editor'
  | 'image_tool'
  | 'video_upscaler'
  | 'image_to_3d'
  | 'video_effect'
  | 'text_to_speech';

export type ModelProvider = 'openai' | 'google' | 'wavespeedai' | 'deepseek' | 'anthropic';

export interface AIModel {
  id: number;
  name: string;
  model_id: string;
  description: string;
  provider: ModelProvider;
  model_type: ModelType;
  base_cost: number;
}

// Chat Types
export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  images: string[];
  created_at: string;
}

export interface ChatSession {
  id: number;
  model: AIModel;
  user: number;
  messages: ChatMessage[];
  summary: string | null;
  created_at: string;
  updated_at: string;
  session_type: ModelType;
}

// Image Session Type (uses same structure as ChatSession for image workflows)
export interface ImageSession extends ChatSession {
  session_type: 'text_to_image' | 'image_to_video' | 'image_editor';
}

// Generated Image
export interface GeneratedImage {
  id: number;
  url: string;
  prompt?: string;
  created_at: string;
}

// WebSocket Message Types
export interface WSSendMessage {
  message: string;
  images?: string[];
  num_images?: number;
  width?: number;
  height?: number;
}

export interface WSReceiveMessage {
  type: 'new_message' | 'error' | 'typing';
  message?: {
    id: number;
    sender: 'ai' | 'user';
    content: string;
    images: string[];
    timestamp: string;
  };
  error?: string;
}

// Plan Types
export interface Plan {
  id: number;
  name: string;
  price: number;
  credits: number;
  features: string[];
  is_popular?: boolean;
}

// Transaction Types
export interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit' | 'subscription' | 'refund' | 'reward';
  transaction_type?: 'credit' | 'debit' | 'subscription' | 'refund' | 'reward';
  description: string;
  created_at: string;
  status?: 'completed' | 'pending' | 'failed';
  reference_id?: string;
}

// History Types
export interface HistoryItem {
  id: number;
  type: 'chat' | 'image' | 'video' | 'audio' | '3d';
  title: string;
  preview?: string;
  preview_url?: string;
  content_url?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  modelName?: string;
  model?: string;
  model_id?: number;
  prompt?: string;
  words_used?: number;
}

// Credit Account Types
export interface CreditAccount {
  credits: number;
  total_credits?: number;
  usedWords: number;
  isPro: boolean;
  bonus_credits?: number;
}

// Credit Package Types
export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
  currency?: string;
  is_popular?: boolean;
  best_value?: boolean;
  bonus_credits?: number;
}

// Notification Types
export interface AppNotification {
  id: number | string;
  title: string;
  message: string;
  body?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'reward';
  read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  marketing_enabled: boolean;
  new_features: boolean;
  credits_alerts: boolean;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
