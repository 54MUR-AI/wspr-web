import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,
};

export const verifyToken = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    try {
      const response = await axios.get('/auth/me');
      return { token, user: response.data };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Authentication failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      localStorage.setItem('token', token);
      const response = await axios.get('/auth/me');
      return { token, user: response.data };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      localStorage.setItem('token', token);
      const response = await axios.get('/auth/me');
      return { token, user: response.data };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Verify token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = action.error.message || 'Authentication failed';
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
