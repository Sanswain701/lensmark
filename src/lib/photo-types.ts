export type Photo = {
  id: string;
  image_url: string;
  medium_url?: string | null;
  thumb_url?: string | null;
  caption?: string | null;
  created_at?: string;
  appreciations_count?: number;
  owner_id?: string;
  width?: number | null;
  height?: number | null;
};