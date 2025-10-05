-- Add content column to books table for text-based books
ALTER TABLE public.books
ADD COLUMN content TEXT;

-- Add book_type column to distinguish between PDF and text books
ALTER TABLE public.books
ADD COLUMN book_type TEXT NOT NULL DEFAULT 'pdf';

-- Add check constraint for book_type
ALTER TABLE public.books
ADD CONSTRAINT book_type_check CHECK (book_type IN ('pdf', 'text'));

-- Make file_url nullable since text books won't have files
ALTER TABLE public.books
ALTER COLUMN file_url DROP NOT NULL;