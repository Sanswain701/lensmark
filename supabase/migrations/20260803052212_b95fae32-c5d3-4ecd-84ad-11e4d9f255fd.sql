-- 1) Restrict private "photos" bucket reads to the owning photographer.
DROP POLICY IF EXISTS "Photos public read" ON storage.objects;

CREATE POLICY "Photos owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2) Hide profiles.trust_score from anon/authenticated via column-level grants.
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, username, display_name, bio, avatar_url, cover_url,
  instagram, twitter, website, featured_collection_id,
  created_at, updated_at
) ON public.profiles TO anon;

GRANT SELECT (
  id, username, display_name, bio, avatar_url, cover_url,
  instagram, twitter, website, featured_collection_id,
  created_at, updated_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- 3) Remaining database-level length constraints on user-supplied text.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_url_length
    CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
  ADD CONSTRAINT profiles_cover_url_length
    CHECK (cover_url IS NULL OR char_length(cover_url) <= 2048);

ALTER TABLE public.photos
  ADD CONSTRAINT photos_image_url_length
    CHECK (char_length(image_url) BETWEEN 1 AND 2048),
  ADD CONSTRAINT photos_storage_path_length
    CHECK (char_length(storage_path) BETWEEN 1 AND 512),
  ADD CONSTRAINT photos_medium_url_length
    CHECK (medium_url IS NULL OR char_length(medium_url) <= 2048),
  ADD CONSTRAINT photos_thumb_url_length
    CHECK (thumb_url IS NULL OR char_length(thumb_url) <= 2048),
  ADD CONSTRAINT photos_medium_path_length
    CHECK (medium_path IS NULL OR char_length(medium_path) <= 512),
  ADD CONSTRAINT photos_thumb_path_length
    CHECK (thumb_path IS NULL OR char_length(thumb_path) <= 512);

ALTER TABLE public.collections
  ADD CONSTRAINT collections_cover_url_length
    CHECK (cover_url IS NULL OR char_length(cover_url) <= 2048);