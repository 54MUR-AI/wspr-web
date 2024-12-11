import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api";

interface ScheduledMessage {
  id: string;
  chatId: string;
  content: string;
  scheduledTime: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface ScheduledMessageState {
  messages: ScheduledMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ScheduledMessageState = {
  messages: [],
  loading: false,
  error: null,
};

export const fetchScheduledMessages = createAsyncThunk(
  "scheduledMessages/fetchAll",
  async () => {
    const response = await api.get("/scheduled-messages");
    return response.data;
  }
);

export const createScheduledMessage = createAsyncThunk(
  "scheduledMessages/create",
  async (messageData: Partial<ScheduledMessage>) => {
    const response = await api.post("/scheduled-messages", messageData);
    return response.data;
  }
);

export const updateScheduledMessage = createAsyncThunk(
  "scheduledMessages/update",
  async ({ id, messageData }: { id: string; messageData: Partial<ScheduledMessage> }) => {
    const response = await api.put(`/scheduled-messages/${id}`, messageData);
    return response.data;
  }
);

export const deleteScheduledMessage = createAsyncThunk(
  "scheduledMessages/delete",
  async (id: string) => {
    await api.delete(`/scheduled-messages/${id}`);
    return id;
  }
);

const scheduledMessageSlice = createSlice({
  name: "scheduledMessages",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchScheduledMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScheduledMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchScheduledMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create message
      .addCase(createScheduledMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      // Update message
      .addCase(updateScheduledMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      // Delete message
      .addCase(deleteScheduledMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter((msg) => msg.id !== action.payload);
      });
  },
});

export default scheduledMessageSlice.reducer;
