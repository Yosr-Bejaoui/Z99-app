import { useState, useEffect, useCallback } from 'react';
import { chatService, AIModel, ChatSession } from '../services';

interface UseChatResult {
  models: AIModel[];
  selectedModel: number | null;
  session: ChatSession | null;
  messages: any[];
  isLoading: boolean;
  isTyping: boolean;
  setSelectedModel: (id: number | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setSession: (session: ChatSession | null) => void;
  fetchModels: () => Promise<void>;
}

export const useChat = (): UseChatResult => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const response = await chatService.getModels('chat');
      const chatModels = response.results || [];
      setModels(chatModels);
      if (chatModels.length > 0) {
        setSelectedModel(chatModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    selectedModel,
    session,
    messages,
    isLoading,
    isTyping,
    setSelectedModel,
    setMessages,
    setSession,
    fetchModels,
  };
};

export default useChat;
