-- 1) Public read for avatars bucket (avatars + covers shown on public profiles)
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2) Profile UPDATE: add WITH CHECK so id can't be reassigned
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3) Truncate any oversized existing data before adding CHECK constraints
UPDATE public.profiles SET bio = left(bio, 280) WHERE bio IS NOT NULL AND char_length(bio) > 280;
UPDATE public.profiles SET display_name = left(display_name, 60) WHERE display_name IS NOT NULL AND char_length(display_name) > 60;
UPDATE public.photos SET caption = left(caption, 500) WHERE caption IS NOT NULL AND char_length(caption) > 500;
UPDATE public.collections SET name = left(name, 100) WHERE char_length(name) > 100;
UPDATE public.collections SET name = 'Untitled' WHERE char_length(name) = 0;
UPDATE public.collections SET description = left(description, 500) WHERE description IS NOT NULL AND char_length(description) > 500;

-- 4) Server-side length/format constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 280),
  ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 60),
  ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  ADD CONSTRAINT profiles_website_length CHECK (website IS NULL OR char_length(website) <= 200),
  ADD CONSTRAINT profiles_instagram_length CHECK (instagram IS NULL OR char_length(instagram) <= 60),
  ADD CONSTRAINT profiles_twitter_length CHECK (twitter IS NULL OR char_length(twitter) <= 60);

ALTER TABLE public.photos
  ADD CONSTRAINT photos_caption_length CHECK (caption IS NULL OR char_length(caption) <= 500);

ALTER TABLE public.collections
  ADD CONSTRAINT collections_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT collections_description_length CHECK (description IS NULL OR char_length(description) <= 500);