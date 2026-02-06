-- Drop the check constraint on category column to allow custom category names
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_check;