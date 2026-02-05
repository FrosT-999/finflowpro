export interface CustomCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  parentId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithChildren extends CustomCategory {
  children: CustomCategory[];
}

// Database row type
export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string;
  parent_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Map DB to app type
export const mapDbCategory = (c: DbCategory): CustomCategory => ({
  id: c.id,
  userId: c.user_id,
  name: c.name,
  type: c.type as 'income' | 'expense',
  color: c.color,
  parentId: c.parent_id,
  isDefault: c.is_default,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

// Group categories with their children (subcategories)
export const groupCategoriesWithChildren = (categories: CustomCategory[]): CategoryWithChildren[] => {
  const parentCategories = categories.filter(c => !c.parentId);
  return parentCategories.map(parent => ({
    ...parent,
    children: categories.filter(c => c.parentId === parent.id),
  }));
};
