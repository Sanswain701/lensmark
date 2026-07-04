import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase-user-client";

export default defineTool({
  name: "list_my_collections",
  title: "List my collections",
  description: "List collections owned by the signed-in user, newest first.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("collections")
      .select("id, name, description, cover_url, created_at, updated_at")
      .eq("owner_id", ctx.getUserId())
      .order("updated_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { collections: data ?? [] },
    };
  },
});