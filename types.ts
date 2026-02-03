
export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt_payment';
export type AccountType = 'bank' | 'cash' | 'card';
export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'vehicle' | 'other';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  accountId: string;
  targetAccountId?: string;
  debtId?: string; // Link to a debt if it's a payment
  description: string;
  date: string;
  type: TransactionType;
  attachments?: Attachment[];
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export interface Obligation {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate?: string;
  type: DebtType;
  icon: string;
  color: string;
}

export interface AppSettings {
  userName: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo?: string; // Base64 string for custom logo
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentación', color: '#ef4444', icon: '🍔' },
  { id: '2', name: 'Vivienda', color: '#3b82f6', icon: '🏠' },
  { id: '3', name: 'Transporte', color: '#f59e0b', icon: '🚗' },
  { id: '4', name: 'Servicios', color: '#10b981', icon: '⚡' },
  { id: '5', name: 'Suscripciones', color: '#8b5cf6', icon: '📺' },
  { id: '6', name: 'Salario', color: '#22c55e', icon: '💰' },
  { id: '7', name: 'Transferencia', color: '#94a3b8', icon: '🔄' },
  { id: '8', name: 'Otros', color: '#64748b', icon: '📦' },
  { id: '9', name: 'Deudas', color: '#6366f1', icon: '📉' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Efectivo', type: 'cash', balance: 0, color: '#10b981', icon: '💵' },
  { id: 'a2', name: 'Banco Principal', type: 'bank', balance: 0, color: '#6366f1', icon: '🏦' },
];
