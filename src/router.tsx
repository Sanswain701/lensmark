import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultError({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-2xl">This page didn't load.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Something went wrong while loading this view."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
        <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm">
          Home
        </Link>
      </div>
    </div>
  );
}

function DefaultNotFound() {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-2xl">Not found.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <div className="mt-5">
        <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Back home
        </Link>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultError,
    defaultNotFoundComponent: DefaultNotFound,
  });

  return router;
};
