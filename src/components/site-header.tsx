import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Camera, Compass, Plus, LogOut, User as UserIcon, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useMyProfile } from "@/hooks/use-profile";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile(user?.id);
  const username = profile?.username ?? null;
  const { theme, resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-gold" strokeWidth={1.5} />
          <span className="font-display text-xl tracking-tight">LensMark</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": "page" } as any}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-300 ease-[var(--ease-luxury)] hover:text-foreground data-[status=active]:text-foreground"
          >
            <span className="inline-flex items-center gap-2"><Compass className="h-4 w-4" strokeWidth={1.5} /> Discover</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Theme"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {resolvedTheme === "dark" ? <Moon className="h-4 w-4" strokeWidth={1.5} /> : <Sun className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">·</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">·</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/upload"><Plus className="h-4 w-4" /> Upload</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-foreground/15 bg-secondary text-sm font-medium ring-1 ring-inset ring-foreground/[0.04] transition-colors hover:border-gold/60"
              >
                    {(username ?? user.email ?? "?").slice(0, 1).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {username && (
                    <DropdownMenuItem asChild>
                      <Link to="/u/$username" params={{ username }}>
                        <UserIcon className="mr-2 h-4 w-4" /> My profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" } as any}>Join LensMark</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}