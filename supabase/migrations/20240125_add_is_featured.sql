-- Add is_featured column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.books.is_featured IS 'Flag to highlight this book on the home page';
