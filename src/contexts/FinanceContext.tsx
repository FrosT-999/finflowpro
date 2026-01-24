import React, { createContext, useContext, ReactNode } from 'react';
import { useTransactions } from '@/hooks/useTransactions';

type FinanceContextType = ReturnType<typeof useTransactions>;

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const finance = useTransactions();

  return (
    <FinanceContext.Provider value={finance}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
