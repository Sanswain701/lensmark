import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth_/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in · LensMark" },
      { name: "description", content: "Completing your LensMark sign-in." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next:
      typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
        ? s.next
        : undefined,
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let done = false;
    const go = (session: unknown) => {
      if (done) return;
      done = true;
      if (!session) {
        setMessage("We couldn't complete the sign-in. Redirecting…");
        navigate({ to: "/auth", search: next ? { next } : {} });
        return;
      }
      if (next) window.location.href = next;
      else navigate({ to: "/" });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go(data.session);
      else setTimeout(() => supabase.auth.getSession().then(({ data: d }) => go(d.session)), 2500);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
