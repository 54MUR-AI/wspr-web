import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { startAuthentication } from '@simplewebauthn/browser';
import { loginUser } from '../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      console.log('Starting authentication...');
      
      // Step 1: Get authentication options from server
      const optionsRes = await fetch('http://localhost:3001/api/auth/login/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get authentication options');
      }

      const options = await optionsRes.json();
      console.log('Got authentication options:', options);

      // Step 2: Authenticate using WebAuthn
      const asseResp = await startAuthentication(options);
      console.log('Authentication response:', asseResp);

      // Step 3: Verify authentication with server
      const verificationRes = await fetch('http://localhost:3001/api/auth/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ...asseResp,
        }),
      });

      if (!verificationRes.ok) {
        throw new Error('Authentication failed');
      }

      const { token } = await verificationRes.json();
      console.log('Login successful!');

      // Step 4: Update auth state and redirect
      await dispatch(loginUser({ token }));
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in to WSPR
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign in with WebAuthn
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/register" variant="body2">
              Don't have an account? Sign up
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
