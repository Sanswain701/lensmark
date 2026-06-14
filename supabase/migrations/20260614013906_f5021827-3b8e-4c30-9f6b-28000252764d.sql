ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS medium_url text,
  ADD COLUMN IF NOT EXISTS thumb_url text,
  ADD COLUMN IF NOT EXISTS medium_path text,
  ADD COLUMN IF NOT EXISTS thumb_path text,
  ADD COLUMN IF NOT EXISTS width int,
  ADD COLUMN IF NOT EXISTS height int;