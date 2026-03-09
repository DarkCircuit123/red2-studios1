import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => void;
  loadMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  addMessage: (message: ChatMessage) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  
  loadMessages: (messages: ChatMessage[]) =>
    set({ messages }),
  
  clearMessages: () =>
    set({ messages: [] }),
  
  setError: (error: string | null) =>
    set({ error }),
  
  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),
}));
