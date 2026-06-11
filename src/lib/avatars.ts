import { supabase } from "@/integrations/supabase/client";

/** Upload a blob to the private avatars bucket and return a long-lived signed URL. */
export async function uploadAvatarBlob(
  userId: string,
  blob: Blob,
  kind: "avatar" | "cover" | "collection",
): Promise<string> {
  const path = `${userId}/${kind}-${Date.now()}.jpg`;
  const up = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (up.error) throw up.error;
  const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}

export function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}