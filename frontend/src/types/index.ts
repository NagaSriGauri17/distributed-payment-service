export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface Payment {
  id: string;
  idempotencyKey: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  idempotencyKey: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface AuditLog {
  auditId: string;
  paymentId: string;
  fromStatus: string;
  toStatus: string;
  eventType: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string;
  currency: string;
  timestamp: string;
  correlationId: string;
}

export interface Notification {
  id: string;
  paymentId: string;
  eventType: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  message: string;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface DashboardStats {
  totalPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalVolume: number;
  successRate: number;
}
