
-- Profile additions: cover image, social links, featured collection
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS featured_collection_id uuid;

-- Add FK after column exists (and not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_featured_collection_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_featured_collection_id_fkey
      FOREIGN KEY (featured_collection_id) REFERENCES public.collections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Validate social fields are sane lengths (use trigger, not CHECK, to allow future url normalization)
CREATE OR REPLACE FUNCTION public.validate_profile_links()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.instagram IS NOT NULL AND length(NEW.instagram) > 60 THEN RAISE EXCEPTION 'instagram handle too long'; END IF;
  IF NEW.twitter   IS NOT NULL AND length(NEW.twitter)   > 60 THEN RAISE EXCEPTION 'twitter handle too long';   END IF;
  IF NEW.website   IS NOT NULL AND length(NEW.website)   > 200 THEN RAISE EXCEPTION 'website url too long';     END IF;
  IF NEW.bio       IS NOT NULL AND length(NEW.bio)       > 500 THEN RAISE EXCEPTION 'bio too long';             END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_validate_links ON public.profiles;
CREATE TRIGGER profiles_validate_links BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_links();

-- Collections: direct cover image url (separate from cover_photo_id auto-derivation)
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS cover_url text;
