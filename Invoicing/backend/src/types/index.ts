import { Request } from 'express';

export type UserRole = 'organization' | 'facility';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'disputed';
export type BillingPeriod = 'monthly' | 'quarterly' | 'semi_annual';

export interface Organization {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Facility {
  id: number;
  organization_id: number;
  name: string;
  email: string;
  password_hash: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  billing_period: BillingPeriod;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: number;
  organization_id: number;
  facility_id: number;
  invoice_number: string;
  amount: number;
  due_date: Date;
  billing_period: BillingPeriod;
  period_start: Date;
  period_end: Date;
  status: InvoiceStatus;
  file_path?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentProof {
  id: number;
  invoice_id: number;
  facility_id: number;
  file_path: string;
  payment_date: Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  uploaded_at: Date;
}

export interface AuthPayload {
  userId: number;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
