
-- Frames: curated portfolio surface per GALLERY_SPEC §8.2 (Loop 4 scope: cover-only)
CREATE TABLE public.frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE RESTRICT,
  display_order INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'published' CHECK (visibility IN ('draft','published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT frames_slug_owner_unique UNIQUE (owner_id, slug),
  CONSTRAINT frames_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT frames_slug_length CHECK (char_length(slug) BETWEEN 1 AND 80),
  CONSTRAINT frames_description_length CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX frames_owner_order_idx ON public.frames (owner_id, display_order);
CREATE INDEX frames_owner_visibility_idx ON public.frames (owner_id, visibility);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO authenticated;
GRANT SELECT ON public.frames TO anon;
GRANT ALL ON public.frames TO service_role;

ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

-- Anyone can read published Frames
CREATE POLICY "Published frames are readable by anyone"
  ON public.frames FOR SELECT
  USING (visibility = 'published');

-- Owner sees all their frames (including drafts)
CREATE POLICY "Owners read own frames"
  ON public.frames FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own frames"
  ON public.frames FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own frames"
  ON public.frames FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own frames"
  ON public.frames FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- updated_at trigger reuses existing touch_updated_at()
CREATE TRIGGER frames_touch_updated_at
  BEFORE UPDATE ON public.frames
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enforce cover photo belongs to the frame owner
CREATE OR REPLACE FUNCTION public.enforce_frame_cover_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner UUID;
BEGIN
  SELECT owner_id INTO photo_owner FROM public.photos WHERE id = NEW.cover_photo_id;
  IF photo_owner IS NULL THEN
    RAISE EXCEPTION 'Cover photo not found';
  END IF;
  IF photo_owner <> NEW.owner_id THEN
    RAISE EXCEPTION 'Cover photo must belong to the frame owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER frames_enforce_cover_owner
  BEFORE INSERT OR UPDATE OF cover_photo_id, owner_id ON public.frames
  FOR EACH ROW EXECUTE FUNCTION public.enforce_frame_cover_owner();
