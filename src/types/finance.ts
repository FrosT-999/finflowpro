export type TransactionType = 'income' | 'expense';

// Legacy category type - kept for backward compatibility
export type Category = 
  | 'alimentacao'
  | 'aluguel'
  | 'transporte'
  | 'lazer'
  | 'investimentos'
  | 'salario'
  | 'freelance'
  | 'outros'
  | string; // Allow any string for custom categories

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string; // Changed from Category to string for custom categories
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface MonthlyGoal {
  id: string;
  month: string; // format: YYYY-MM
  targetAmount: number;
  createdAt: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  alimentacao: 'Alimentação',
  aluguel: 'Aluguel',
  transporte: 'Transporte',
  lazer: 'Lazer',
  investimentos: 'Investimentos',
  salario: 'Salário',
  freelance: 'Freelance',
  outros: 'Outros',
};

export const CATEGORY_ICONS: Record<string, string> = {
  alimentacao: 'UtensilsCrossed',
  aluguel: 'Home',
  transporte: 'Car',
  lazer: 'Gamepad2',
  investimentos: 'TrendingUp',
  salario: 'Briefcase',
  freelance: 'Laptop',
  outros: 'MoreHorizontal',
};

export const INCOME_CATEGORIES: string[] = ['salario', 'freelance', 'investimentos', 'outros'];
export const EXPENSE_CATEGORIES: string[] = ['alimentacao', 'aluguel', 'transporte', 'lazer', 'investimentos', 'outros'];
