import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-user-client";

export default defineTool({
  name: "list_recent_photos",
  title: "Discover recent photos",
  description: "Browse the newest publicly visible photos on LensMark across all photographers.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max photos to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("photos")
      .select("id, caption, width, height, appreciations_count, image_url, thumb_url, owner_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { photos: data ?? [] },
    };
  },
});