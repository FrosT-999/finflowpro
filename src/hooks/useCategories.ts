import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  CustomCategory, 
  CategoryWithChildren, 
  DbCategory, 
  mapDbCategory,
  groupCategoriesWithChildren 
} from '@/types/category';

export function useCategories() {
  const { user } = useAuthContext();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories from Supabase
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories((data || []).map(mapDbCategory));
  }, [user]);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchCategories().then(() => setIsLoaded(true));
    } else {
      setCategories([]);
      setIsLoaded(true);
    }
  }, [user, fetchCategories]);

  // Add category
  const addCategory = useCallback(async (
    category: Pick<CustomCategory, 'name' | 'type' | 'color' | 'parentId'>
  ) => {
    if (!user) throw new Error('Not authenticated');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .insert({
          user_id: user.id,
          name: category.name.trim(),
          type: category.type,
          color: category.color,
          parent_id: category.parentId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newCategory = mapDbCategory(data as DbCategory);
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      return newCategory;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update category
  const updateCategory = useCallback(async (
    id: string,
    updates: Partial<Pick<CustomCategory, 'name' | 'color' | 'parentId'>>
  ) => {
    if (!user) throw new Error('Not authenticated');
    setIsLoading(true);

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId || null;

      const { error } = await supabase
        .from('custom_categories')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => 
        prev.map(c => c.id === id ? { ...c, ...updates } : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get categories by type
  const getCategoriesByType = useCallback((type: 'income' | 'expense') => {
    return categories.filter(c => c.type === type && !c.parentId);
  }, [categories]);

  // Get categories with children (hierarchical)
  const categoriesWithChildren = useMemo(() => {
    return groupCategoriesWithChildren(categories);
  }, [categories]);

  // Get income categories with children
  const incomeCategoriesWithChildren = useMemo(() => {
    return categoriesWithChildren.filter(c => c.type === 'income');
  }, [categoriesWithChildren]);

  // Get expense categories with children
  const expenseCategoriesWithChildren = useMemo(() => {
    return categoriesWithChildren.filter(c => c.type === 'expense');
  }, [categoriesWithChildren]);

  // Get category by ID
  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  // Get category by name and type (for backward compatibility)
  const getCategoryByName = useCallback((name: string, type: 'income' | 'expense') => {
    return categories.find(c => c.name === name && c.type === type);
  }, [categories]);

  return {
    categories,
    isLoaded,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getCategoryById,
    getCategoryByName,
    categoriesWithChildren,
    incomeCategoriesWithChildren,
    expenseCategoriesWithChildren,
    refetch: fetchCategories,
  };
}
