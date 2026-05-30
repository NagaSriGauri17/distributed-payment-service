import axios from 'axios';
import { Payment, CreatePaymentRequest, AuditLog } from '../types';

const paymentApi = axios.create({ baseURL: 'http://localhost:8080' });
const auditApi   = axios.create({ baseURL: 'http://localhost:8082' });

// Add correlation ID to every request for tracing
paymentApi.interceptors.request.use(config => {
  config.headers['X-Correlation-ID'] = crypto.randomUUID();
  return config;
});

// ── Payment API ──────────────────────────────────────────────────────────────
export const createPayment = async (req: CreatePaymentRequest): Promise<Payment> => {
  const { data } = await paymentApi.post<Payment>('/api/v1/payments', req);
  return data;
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  const { data } = await paymentApi.get<Payment>(`/api/v1/payments/${id}`);
  return data;
};

export const getPaymentsByAccount = async (accountId: string): Promise<Payment[]> => {
  const { data } = await paymentApi.get<Payment[]>(`/api/v1/payments/account/${accountId}`);
  return data;
};

export const reversePayment = async (id: string): Promise<Payment> => {
  const { data } = await paymentApi.post<Payment>(`/api/v1/payments/${id}/reverse`);
  return data;
};

// ── Audit API ────────────────────────────────────────────────────────────────
export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  const { data } = await auditApi.get<AuditLog[]>('/api/v1/audit');
  return data;
};

export const getAuditByPayment = async (paymentId: string): Promise<AuditLog[]> => {
  const { data } = await auditApi.get<AuditLog[]>(`/api/v1/audit/payment/${paymentId}`);
  return data;
};

// ── Actuator metrics (payment-api) ───────────────────────────────────────────
export const getActuatorHealth = async () => {
  const { data } = await paymentApi.get('/actuator/health');
  return data;
};
