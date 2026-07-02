import { Link } from "@tanstack/react-router";
import { Compass, Plus, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profile";

/**
 * Mobile-only bottom navigation. Hidden on md+ so desktop layout is unchanged.
 */
export function MobileBottomNav() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile(user?.id);

  const item =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors data-[status=active]:text-foreground";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        <li className="flex flex-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": "page" } as any}
            className={item}
          >
            <Compass className="h-5 w-5" strokeWidth={1.5} />
            <span>Discover</span>
          </Link>
        </li>
        {user && (
          <li className="flex flex-1">
            <Link
              to="/upload"
              activeProps={{ "aria-current": "page" } as any}
              className={item}
            >
              <Plus className="h-5 w-5" strokeWidth={1.5} />
              <span>Upload</span>
            </Link>
          </li>
        )}
        <li className="flex flex-1">
          {user && profile?.username ? (
            <Link
              to="/u/$username"
              params={{ username: profile.username }}
              activeProps={{ "aria-current": "page" } as any}
              className={item}
            >
              <UserIcon className="h-5 w-5" strokeWidth={1.5} />
              <span>Profile</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              activeProps={{ "aria-current": "page" } as any}
              className={item}
            >
              <UserIcon className="h-5 w-5" strokeWidth={1.5} />
              <span>Sign in</span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}