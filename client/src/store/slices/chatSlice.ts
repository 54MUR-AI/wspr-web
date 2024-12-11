import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
}

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  loading: boolean;
  error: string | null;
  unreadMessages: { [chatId: string]: number };
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  loading: false,
  error: null,
  unreadMessages: {},
};

// Async thunks
export const fetchChats = createAsyncThunk('chat/fetchChats', async () => {
  const response = await axios.get('/api/chats');
  return response.data;
});

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }: { chatId: string; content: string }) => {
    const response = await axios.post(`/api/chats/${chatId}/messages`, { content });
    return response.data;
  }
);

export const markMessageAsRead = createAsyncThunk(
  'chat/markMessageAsRead',
  async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
    await axios.put(`/api/chats/${chatId}/messages/${messageId}/read`);
    return { chatId, messageId };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
      if (action.payload) {
        state.unreadMessages[action.payload] = 0;
      }
    },
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        chat.messages.push(message);
        chat.lastMessage = message;
        if (chatId !== state.activeChat) {
          state.unreadMessages[chatId] = (state.unreadMessages[chatId] || 0) + 1;
        }
      }
    },
    updateMessageStatus: (state, action) => {
      const { chatId, messageId, status } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const message = chat.messages.find(m => m.id === messageId);
        if (message) {
          message.status = status;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch chats';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          chat.messages.push(message);
          chat.lastMessage = message;
        }
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { chatId, messageId } = action.payload;
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          const message = chat.messages.find(m => m.id === messageId);
          if (message) {
            message.status = 'read';
          }
        }
      });
  },
});

export const { setActiveChat, addMessage, updateMessageStatus } = chatSlice.actions;

export default chatSlice.reducer;
