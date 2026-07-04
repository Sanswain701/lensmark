import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

// Supabase's OAuth server (created via configure_oauth_server) is beta; the
// `supabase.auth.oauth` namespace isn't in the generated types yet. Type it
// locally rather than reaching into node_modules.
type AuthorizationDetails = {
  client?: { name?: string | null; logo_uri?: string | null; client_uri?: string | null } | null;
  scopes?: string[] | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
const authOAuth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase session lives in localStorage, absent during
  // SSR. Without this, getSession() returns null on the server pass and
  // bounces signed-in users to /auth unnecessarily.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentScreen,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="font-display text-2xl">This authorization couldn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function ConsentScreen() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "This app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = authOAuth();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Camera className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-display text-lg">LensMark</span>
      </div>
      <h1 className="font-display text-3xl tracking-tight">
        Connect {clientName} to your LensMark account
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {clientName} will be able to act as you inside LensMark — reading your profile,
        your photographs, and your collections. You can disconnect it at any time.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-2">
        <Button disabled={busy} onClick={() => decide(true)}>
          {busy ? "Please wait…" : `Approve ${clientName}`}
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => decide(false)}>
          Deny
        </Button>
      </div>
    </main>
  );
}