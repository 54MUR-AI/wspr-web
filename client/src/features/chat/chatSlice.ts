import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import axios from 'axios';

interface FileUploadArgs {
  formData: FormData;
  onProgress: (progress: number) => void;
}

export const uploadFile = createAsyncThunk(
  'chat/uploadFile',
  async ({ formData, onProgress }: FileUploadArgs) => {
    const response = await axios.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 0)
        );
        onProgress(progress);
      },
    });
    return response.data;
  }
);

export const downloadFile = createAsyncThunk(
  'chat/downloadFile',
  async (fileId: string) => {
    const response = await axios.get(`/api/files/download/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  }
);

interface ChatState {
  messages: any[];
  files: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  files: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add any synchronous reducers here
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.push(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Upload failed';
      })
      .addCase(downloadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Download failed';
      });
  },
});

export const selectFiles = (state: RootState) => state.chat.files;
export const selectLoading = (state: RootState) => state.chat.loading;
export const selectError = (state: RootState) => state.chat.error;

export default chatSlice.reducer;
