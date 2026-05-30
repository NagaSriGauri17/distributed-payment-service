import React, { useState, createContext, useContext, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme/theme';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AuditPage } from './pages/AuditPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { MetricsPage } from './pages/MetricsPage';

export const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'dark' as 'light' | 'dark' });
export const AuthContext = createContext({ user: null as any, login: (u: any) => {}, logout: () => {} });

export const useAuth = () => useContext(AuthContext);
export const useColorMode = () => useContext(ColorModeContext);

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any>(null);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => setMode(m => m === 'dark' ? 'light' : 'dark'),
    mode,
  }), [mode]);

  const auth = useMemo(() => ({
    user,
    login: (u: any) => setUser(u),
    logout: () => setUser(null),
  }), [user]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <AuthContext.Provider value={auth}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            {!user ? (
              <LoginPage />
            ) : (
              <AppLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AppLayout>
            )}
          </BrowserRouter>
        </ThemeProvider>
      </AuthContext.Provider>
    </ColorModeContext.Provider>
  );
}

export default App;
