import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · LensMark" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      const parsed = z.string().email().safeParse(email.trim());
      if (!parsed.success) return toast.error("Enter a valid email");
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your inbox for a reset link.");
      setMode("signin");
      return;
    }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome to LensMark. Check your email to confirm.");
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/" });
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      return toast.error(result.error.message);
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Camera className="h-4 w-4" strokeWidth={1.5} />
          <span className="font-display text-lg">LensMark</span>
        </Link>
        <div className="my-auto">
          <h1 className="font-display text-4xl tracking-tight">
            {mode === "signup" ? "Create your gallery." : mode === "forgot" ? "Reset your password." : "Welcome back."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "A quieter place for your photographs."
              : mode === "forgot"
                ? "We'll email you a link to set a new password."
                : "Sign in to continue."}
          </p>

          {mode !== "forgot" && (
            <>
              <Button onClick={google} variant="outline" className="mt-8 w-full" disabled={busy}>
                Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">Sign in</button>
              </>
            ) : mode === "signin" ? (
              <>New to LensMark?{" "}
                <button onClick={() => setMode("signup")} className="text-foreground underline-offset-4 hover:underline">Create an account</button>
              </>
            ) : (
              <button onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">Back to sign in</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}