import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-user-client";

export default defineTool({
  name: "list_my_photos",
  title: "List my photos",
  description: "List photos uploaded by the signed-in user, newest first. Returns id, caption, dimensions, appreciations count, image URLs, and created_at.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max photos to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("photos")
      .select("id, caption, width, height, appreciations_count, image_url, medium_url, thumb_url, created_at")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { photos: data ?? [] },
    };
  },
});