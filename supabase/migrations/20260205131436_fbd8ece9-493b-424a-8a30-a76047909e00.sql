-- Create custom categories table
CREATE TABLE public.custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text DEFAULT '#6366f1',
  parent_id uuid REFERENCES public.custom_categories(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

-- Enable RLS
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own categories"
  ON public.custom_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.custom_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.custom_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.custom_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_categories_updated_at
  BEFORE UPDATE ON public.custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to seed default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default expense categories
  INSERT INTO public.custom_categories (user_id, name, type, color, is_default) VALUES
    (NEW.id, 'Alimentação', 'expense', '#ef4444', true),
    (NEW.id, 'Aluguel', 'expense', '#f97316', true),
    (NEW.id, 'Transporte', 'expense', '#eab308', true),
    (NEW.id, 'Lazer', 'expense', '#22c55e', true),
    (NEW.id, 'Investimentos', 'expense', '#06b6d4', true),
    (NEW.id, 'Outros', 'expense', '#6b7280', true);
  
  -- Default income categories
  INSERT INTO public.custom_categories (user_id, name, type, color, is_default) VALUES
    (NEW.id, 'Salário', 'income', '#10b981', true),
    (NEW.id, 'Freelance', 'income', '#8b5cf6', true),
    (NEW.id, 'Investimentos', 'income', '#3b82f6', true),
    (NEW.id, 'Outros', 'income', '#6b7280', true);
  
  RETURN NEW;
END;
$$;

-- Trigger to create default categories for new users
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();