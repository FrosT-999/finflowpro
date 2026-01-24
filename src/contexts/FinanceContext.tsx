import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseTransactions } from '@/hooks/useSupabaseTransactions';

type FinanceContextType = ReturnType<typeof useSupabaseTransactions>;

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const finance = useSupabaseTransactions();

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
