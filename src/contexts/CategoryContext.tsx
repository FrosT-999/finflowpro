import React, { createContext, useContext, ReactNode } from 'react';
import { useCategories } from '@/hooks/useCategories';

type CategoryContextType = ReturnType<typeof useCategories>;

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const categoryData = useCategories();

  return (
    <CategoryContext.Provider value={categoryData}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
}
