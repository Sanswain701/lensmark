import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * The Lovable OAuth broker lives at `/~oauth/*`, which only exists behind
 * Lovable's hosting proxy (*.lovable.app / *.lovable.dev). On any other host
 * (e.g. a Vercel deployment) those paths 404, so we fall back to Supabase's
 * own OAuth endpoint, which works from any origin as long as the origin is in
 * the backend's allowed redirect URLs.
 */
export function isLovableHost(hostname = window.location.hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovable.dev")
  );
}

type Result = { error?: { message?: string } | null; redirected?: boolean };

export async function signInWithGoogle(redirectTo: string): Promise<Result> {
  if (isLovableHost()) {
    return (await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectTo,
    })) as Result;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) return { error };
  // Supabase navigates the browser to Google.
  return { redirected: true };
}
