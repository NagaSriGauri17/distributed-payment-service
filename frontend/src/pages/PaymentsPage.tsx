import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Table,
  TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Alert, CircularProgress, Snackbar, Tooltip, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { TopBar } from '../components/layout/TopBar';
import { StatusChip } from '../components/common/StatusChip';
import { paymentApi } from '../api/paymentApi';
import { Payment, CreatePaymentRequest } from '../types';

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'JPY', 'HKD'];
const ACCOUNTS = ['ACC001', 'ACC002', 'ACC003', 'ACC004'];

const emptyForm: CreatePaymentRequest = {
  idempotencyKey: '', sourceAccount: '', destinationAccount: '',
  amount: 0, currency: 'INR', description: '',
};

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePaymentRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [searchAccount, setSearchAccount] = useState('ACC001');
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const load = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.getByAccount(searchAccount);
      setPayments(data);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payment = await paymentApi.create({
        ...form,
        idempotencyKey: form.idempotencyKey || `key-${Date.now()}`,
        amount: Number(form.amount),
      });
      setPayments(prev => [payment, ...prev]);
      setSnack({ open: true, msg: `Payment ${payment.id.slice(0,8)}… created successfully!`, severity: 'success' });
      setOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      setSnack({ open: true, msg: e.response?.data?.message || 'Failed to create payment', severity: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleReverse = async (id: string) => {
    try {
      const updated = await paymentApi.reverse(id);
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
      setSnack({ open: true, msg: `Payment reversed successfully`, severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, msg: e.response?.data?.message || 'Cannot reverse payment', severity: 'error' });
    }
  };

  return (
    <Box sx={{ flex: 1 }}>
      <TopBar title="Payments" subtitle="Create, view and manage payment transactions" onRefresh={load} />
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField select label="Account" value={searchAccount} size="small"
            onChange={e => setSearchAccount(e.target.value)} sx={{ width: 160 }}>
            {ACCOUNTS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={load}
            sx={{ borderColor: dark ? 'rgba(99,102,241,0.3)' : undefined, color: '#6366f1' }}>
            Search
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            New Payment
          </Button>
        </Box>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: dark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                  {['Payment ID', 'From', 'To', 'Amount', 'Status', 'Created', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: '#6366f1' }} /></TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" variant="body2">No payments found. Create your first one!</Typography>
                  </TableCell></TableRow>
                ) : payments.map(p => (
                  <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: dark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)' } }}>
                    <TableCell>
                      <Tooltip title={p.id} placement="top">
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => navigator.clipboard.writeText(p.id)}>
                          {p.id?.slice(0, 13)}…
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.sourceAccount}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.destinationAccount}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {p.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span style={{ color: '#64748b', fontWeight: 400 }}>{p.currency}</span>
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={p.status} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: dark ? '#64748b' : '#94a3b8' }}>
                        {new Date(p.createdAt).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {p.status === 'COMPLETED' && (
                        <Tooltip title="Reverse payment">
                          <IconButton size="small" onClick={() => handleReverse(p.id)}
                            sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: dark ? '1px solid rgba(99,102,241,0.2)' : 'none' } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          color: '#fff', fontWeight: 800, fontSize: '1.1rem',
        }}>
          New Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Idempotency Key" value={form.idempotencyKey} size="small"
                placeholder="Leave blank to auto-generate"
                onChange={e => setForm(f => ({ ...f, idempotencyKey: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="From Account" value={form.sourceAccount} size="small"
                onChange={e => setForm(f => ({ ...f, sourceAccount: e.target.value }))}>
                {ACCOUNTS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="To Account" value={form.destinationAccount} size="small"
                onChange={e => setForm(f => ({ ...f, destinationAccount: e.target.value }))}>
                {ACCOUNTS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth label="Amount" type="number" value={form.amount || ''} size="small"
                inputProps={{ min: 0.01, step: 0.01 }}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField select fullWidth label="Currency" value={form.currency} size="small"
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description (optional)" value={form.description} size="small"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: dark ? '#64748b' : '#94a3b8' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={submitting || !form.sourceAccount || !form.destinationAccount || !form.amount}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', px: 3 }}>
            {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Create Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
