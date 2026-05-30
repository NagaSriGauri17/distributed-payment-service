import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  IconButton, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import UndoIcon from '@mui/icons-material/Undo';
import { createPayment, getPaymentsByAccount, reversePayment } from '../services/api';
import { Payment, CreatePaymentRequest } from '../types';
import StatusChip from '../components/StatusChip';

const CURRENCIES = ['GBP', 'USD', 'EUR', 'SGD', 'HKD'];

const emptyForm: CreatePaymentRequest = {
  idempotencyKey: '', sourceAccount: '', destinationAccount: '',
  amount: 0, currency: 'GBP', description: '',
};

export default function Payments() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState<CreatePaymentRequest>(emptyForm);
  const [searchAccount, setSearch]  = useState('');
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]           = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  const showAlert = (type: 'success'|'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSearch = useCallback(async () => {
    if (!searchAccount.trim()) return;
    setLoading(true);
    try {
      const data = await getPaymentsByAccount(searchAccount.trim());
      setPayments(data);
    } catch {
      showAlert('error', 'Could not fetch payments. Is the backend running?');
    } finally { setLoading(false); }
  }, [searchAccount]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const newPayment = await createPayment({
        ...form,
        idempotencyKey: form.idempotencyKey || crypto.randomUUID(),
      });
      setPayments(prev => [newPayment, ...prev]);
      setOpen(false);
      setForm(emptyForm);
      showAlert('success', `Payment ${newPayment.id} created successfully`);
    } catch (e: any) {
      showAlert('error', e.response?.data?.message || 'Failed to create payment');
    } finally { setSubmitting(false); }
  };

  const handleReverse = async (id: string) => {
    try {
      const reversed = await reversePayment(id);
      setPayments(prev => prev.map(p => p.id === id ? reversed : p));
      showAlert('success', `Payment ${id} reversed`);
    } catch (e: any) {
      showAlert('error', e.response?.data?.message || 'Reversal failed');
    }
  };

  const field = (key: keyof CreatePaymentRequest, label: string, extra?: object) => (
    <TextField fullWidth label={label} size="small" sx={{ mb: 2 }}
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      {...extra} />
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Payments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#DB0011', '&:hover': { bgcolor: '#b0000d' } }}>
          New Payment
        </Button>
      </Box>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth size="small" label="Search by source account (e.g. ACC-001)"
              value={searchAccount} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleSearch}
              disabled={loading} sx={{ minWidth: 120 }}>
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                {['Payment ID', 'From', 'To', 'Amount', 'Currency', 'Status', 'Created', 'Actions']
                  .map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Search by account ID to see payments
                  </TableCell>
                </TableRow>
              ) : payments.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.id.slice(0, 8)}…</TableCell>
                  <TableCell>{p.sourceAccount}</TableCell>
                  <TableCell>{p.destinationAccount}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {Number(p.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell><Chip label={p.currency} size="small" variant="outlined" /></TableCell>
                  <TableCell><StatusChip status={p.status} /></TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {p.status === 'COMPLETED' && (
                      <Tooltip title="Reverse payment">
                        <IconButton size="small" onClick={() => handleReverse(p.id)}>
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

      {/* Create Payment Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {field('sourceAccount', 'Source Account (e.g. ACC-001)')}
          {field('destinationAccount', 'Destination Account')}
          <TextField fullWidth label="Amount" size="small" type="number" sx={{ mb: 2 }}
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} />
          <TextField select fullWidth label="Currency" size="small" sx={{ mb: 2 }}
            value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          {field('description', 'Description (optional)')}
          <TextField fullWidth label="Idempotency Key (leave blank to auto-generate)" size="small"
            value={form.idempotencyKey} onChange={e => setForm(f => ({ ...f, idempotencyKey: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}
            sx={{ bgcolor: '#DB0011', '&:hover': { bgcolor: '#b0000d' } }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Create Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
