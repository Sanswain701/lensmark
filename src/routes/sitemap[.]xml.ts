import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://lensmark.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
        ];

        const [profiles, photos, collections] = await Promise.all([
          supabase.from("profiles").select("username").limit(1000),
          supabase.from("photos").select("id").order("created_at", { ascending: false }).limit(2000),
          supabase.from("collections").select("id").limit(1000),
        ]);

        for (const p of profiles.data ?? []) {
          entries.push({ path: `/g/${p.username}`, changefreq: "weekly", priority: "0.8" });
          entries.push({ path: `/g/${p.username}/frames`, changefreq: "weekly", priority: "0.6" });
          entries.push({ path: `/g/${p.username}/collections`, changefreq: "weekly", priority: "0.6" });
          entries.push({ path: `/g/${p.username}/about`, changefreq: "monthly", priority: "0.5" });
          entries.push({ path: `/u/${p.username}`, changefreq: "weekly", priority: "0.6" });
        }
        for (const p of photos.data ?? []) {
          entries.push({ path: `/p/${p.id}`, changefreq: "monthly", priority: "0.6" });
        }
        for (const c of collections.data ?? []) {
          entries.push({ path: `/c/${c.id}`, changefreq: "monthly", priority: "0.6" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
