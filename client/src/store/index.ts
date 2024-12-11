import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';
import templateReducer from './slices/templateSlice';
import scheduledMessageReducer from './slices/scheduledMessageSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    templates: templateReducer,
    scheduledMessages: scheduledMessageReducer,
    messages: messagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
