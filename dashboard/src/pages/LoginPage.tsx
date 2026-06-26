import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Inventory2Outlined, Security, GppGood } from '@mui/icons-material';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleDemoLogin = async () => {
    setEmail('admin@natpharm.co.zw');
    setPassword('Test@123');
    setError('');
    setLoading(true);
    try {
      await login('admin@natpharm.co.zw', 'Test@123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url('/images/mohcc_building.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/images/mohcc_emblem.png"
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                objectFit: 'contain',
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0E4A27' }}>
              HealthBridge MedTrack
            </Typography>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 600, mt: 1 }}>
              Ministry of Health and Child Care<br/>& NatPharm Official Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                bgcolor: '#0E4A27',
                '&:hover': { bgcolor: '#083018' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleDemoLogin}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                color: '#0E4A27',
                borderColor: '#0E4A27',
                '&:hover': { borderColor: '#083018', bgcolor: 'rgba(14, 74, 39, 0.04)' },
              }}
            >
              Demo Admin Login
            </Button>
          </form>

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: '#38A169' }}>
              <GppGood sx={{ fontSize: 20, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                AES-256 End-to-End Encryption Active
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: '#A0AEC0', display: 'block', textAlign: 'center', lineHeight: 1.4 }}
            >
              Authorised personnel only. Fully compliant with the <strong>Zimbabwe Cyber and Data Protection Act (CDPA)</strong>. All data is localized and secured within Zimbabwe borders.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
