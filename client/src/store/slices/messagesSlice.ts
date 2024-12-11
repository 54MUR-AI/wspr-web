import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface MessagesState {
  conversations: Conversation[];
  messages: {
    [conversationId: string]: Message[];
  };
}

const initialState: MessagesState = {
  conversations: [],
  messages: {},
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addConversation: (
      state,
      action: PayloadAction<{
        recipients: User[];
        message: string;
      }>
    ) => {
      const conversationId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Add the conversation
      state.conversations.unshift({
        id: conversationId,
        participants: action.payload.recipients,
        lastMessage: action.payload.message,
        timestamp,
        unread: false,
      });

      // Add the first message
      state.messages[conversationId] = [{
        id: uuidv4(),
        conversationId,
        content: action.payload.message,
        senderId: 'currentUser',
        timestamp,
      }];
    },

    addMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        content: string;
      }>
    ) => {
      const { conversationId, content } = action.payload;
      const timestamp = new Date().toISOString();

      // Add the message to the conversation
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      state.messages[conversationId].push({
        id: uuidv4(),
        conversationId,
        content,
        senderId: 'currentUser',
        timestamp,
      });

      // Update the conversation's last message
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = content;
        conversation.timestamp = timestamp;
      }
    },

    markConversationAsRead: (
      state,
      action: PayloadAction<string>
    ) => {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.unread = false;
      }
    },
  },
});

export const { addConversation, addMessage, markConversationAsRead } = messagesSlice.actions;

export default messagesSlice.reducer;
