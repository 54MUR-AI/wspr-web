import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Messages from './pages/messages';
import NewMessage from './pages/messages/NewMessage';
import ChatWindow from './pages/messages/ChatWindow';
import Contacts from './pages/contacts';
import FindContacts from './pages/contacts/FindContacts';
import Notifications from './pages/notifications';
import Settings from './pages/settings';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { RootState } from './store';
import { verifyToken } from './store/slices/authSlice';

const App = () => {
  const dispatch = useDispatch();
  const { token, loading } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!token;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {isAuthenticated && <Navbar />}
        {isAuthenticated && <Sidebar />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isAuthenticated ? 3 : 0,
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'background.default'
          }}
        >
          {isAuthenticated && <Box sx={{ height: '64px' }} />} {/* Toolbar spacer */}
          <Routes>
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/auth/register"
              element={
                !isAuthenticated ? (
                  <Register />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/register"
              element={<Navigate to="/auth/register" replace />}
            />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Home />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/messages"
              element={
                isAuthenticated ? (
                  <Messages />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/messages/new"
              element={
                isAuthenticated ? (
                  <NewMessage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/messages/:id"
              element={
                isAuthenticated ? (
                  <ChatWindow />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/contacts"
              element={
                isAuthenticated ? (
                  <Contacts />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/contacts/find"
              element={
                isAuthenticated ? (
                  <FindContacts />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/notifications"
              element={
                isAuthenticated ? (
                  <Notifications />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <Settings />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
};

export default App;
