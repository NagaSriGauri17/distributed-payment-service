import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Avatar, Alert, InputAdornment, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BoltIcon from '@mui/icons-material/Bolt';
import { useAuth } from '../App';

const USERS = [
  { username: 'admin', password: 'admin123', name: 'Admin User', role: 'Administrator', initials: 'AU' },
  { username: 'gauri', password: 'gauri123', name: 'Gauri Naga Sri', role: 'Backend Engineer', initials: 'GN' },
  { username: 'demo', password: 'demo123', name: 'Demo User', role: 'Viewer', initials: 'DU' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      login(user);
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 50%, #0f0f1a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      {[
        { top: '-10%', left: '-5%', size: 400, color: 'rgba(99,102,241,0.15)' },
        { top: '60%', right: '-5%', size: 300, color: 'rgba(6,182,212,0.1)' },
        { top: '30%', left: '60%', size: 200, color: 'rgba(139,92,246,0.08)' },
      ].map((orb, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: orb.size,
          height: orb.size,
          borderRadius: '50%',
          background: orb.color,
          filter: 'blur(60px)',
          top: orb.top,
          left: orb.left,
          right: (orb as any).right,
          pointerEvents: 'none',
        }} />
      ))}

      <Card sx={{
        width: 420,
        position: 'relative',
        background: 'rgba(26,26,46,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              mb: 2, boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}>
              <BoltIcon sx={{ color: '#fff', fontSize: 36 }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#e2e8f0', fontWeight: 800, letterSpacing: '-0.5px' }}>
              PayFlow
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Distributed Payment Platform
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 3, fontWeight: 700 }}>
            Sign in to continue
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <TextField
            fullWidth label="Username" value={username} size="small"
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#6366f1', fontSize: 20 }} /></InputAdornment>,
            }}
          />
          <TextField
            fullWidth label="Password" value={password} size="small"
            type={showPw ? 'text' : 'password'}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#6366f1', fontSize: 20 }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPw(v => !v)} edge="end">
                    {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading || !username || !password}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              fontWeight: 800, fontSize: '1rem', py: 1.5,
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              '&:hover': { boxShadow: '0 6px 24px rgba(99,102,241,0.5)' },
            }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontWeight: 600 }}>
              Demo credentials
            </Typography>
            {USERS.map(u => (
              <Typography key={u.username} variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                <span style={{ color: '#818cf8' }}>{u.username}</span> / {u.password} — {u.role}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
