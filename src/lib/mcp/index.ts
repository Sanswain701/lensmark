import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listMyPhotosTool from "./tools/list-my-photos";
import listMyCollectionsTool from "./tools/list-my-collections";
import recentPhotosTool from "./tools/recent-photos";

// The OAuth issuer MUST be the direct Supabase host — the `.lovable.cloud`
// proxy URL fails RFC 8414 issuer matching. Read the project ref from
// VITE_SUPABASE_PROJECT_ID, which Vite inlines as a literal at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lensmark-mcp",
  title: "LensMark",
  version: "0.1.0",
  instructions:
    "Tools for LensMark, a photography-first platform. Use `whoami` for the signed-in photographer's profile, `list_my_photos` and `list_my_collections` for their own work, and `list_recent_photos` to discover newly shared photographs.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listMyPhotosTool, listMyCollectionsTool, recentPhotosTool],
});