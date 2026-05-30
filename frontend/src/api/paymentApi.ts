import axios from 'axios';
import { Payment, CreatePaymentRequest, AuditLog } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = crypto.randomUUID();
  return config;
});

export const paymentApi = {
  create: (req: CreatePaymentRequest) =>
    api.post<Payment>('/payments', req).then((r) => r.data),
  getById: (id: string) =>
    api.get<Payment>(`/payments/${id}`).then((r) => r.data),
  getByAccount: (accountId: string) =>
    api.get<Payment[]>(`/payments/account/${accountId}`).then((r) => r.data),
  reverse: (id: string) =>
    api.post<Payment>(`/payments/${id}/reverse`).then((r) => r.data),
};

export const auditApi = {
  // Now goes through nginx proxy, no direct localhost:8082
  getAll: () =>
    axios.get<AuditLog[]>('/api/v1/audit').then((r) => r.data),
  getByPayment: (paymentId: string) =>
    axios.get<AuditLog[]>(`/api/v1/audit/payment/${paymentId}`).then((r) => r.data),
};
