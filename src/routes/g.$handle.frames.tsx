import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, Frame as FrameIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { galleryQueryOptions } from "@/lib/gallery";
import { framesListQueryOptions, FRAMES_CAP, type Frame } from "@/lib/frames";
import { FrameCard } from "@/components/gallery/frame-card";
import { FrameEditor } from "@/components/gallery/frame-editor";

type FramesSearch = { new?: boolean; photo?: string; edit?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateFramesSearch = (raw: Record<string, unknown>): FramesSearch => {
  const out: FramesSearch = {};
  if (raw.new === true || raw.new === "1" || raw.new === "true") out.new = true;
  if (typeof raw.photo === "string" && UUID_RE.test(raw.photo)) out.photo = raw.photo;
  if (typeof raw.edit === "string" && UUID_RE.test(raw.edit)) out.edit = raw.edit;
  return out;
};

export const Route = createFileRoute("/g/$handle/frames")({
  validateSearch: validateFramesSearch,
  head: ({ params }) => ({
    meta: [
      { title: `Frames · @${params.handle} · LensMark` },
      { name: "description", content: `The permanent portfolio of @${params.handle}.` },
      { property: "og:title", content: `Frames · @${params.handle}` },
      { property: "og:description", content: `The permanent portfolio of @${params.handle}.` },
    ],
  }),
  component: FramesSectionRoute,
});

function FramesSectionRoute() {
  const { handle } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gallery = useSuspenseQuery(galleryQueryOptions(handle));
  const owner = gallery.data.profile!;
  const isOwner = Boolean(user && user.id === owner.id);

  const framesQ = useQuery(framesListQueryOptions(owner.id, { includeDrafts: isOwner }));
  const frames = framesQ.data ?? [];

  const [editing, setEditing] = useState<Frame | null>(null);
  const [creating, setCreating] = useState<boolean>(Boolean(search.new || search.photo));
  const presetCoverId = search.photo;

  // Auto-open editor when arriving with ?edit=<frameId>
  const editFrame = useMemo(
    () => (search.edit ? frames.find((f) => f.id === search.edit) : null),
    [search.edit, frames],
  );

  const clearSearch = () =>
    navigate({ to: "/g/$handle/frames", params: { handle }, search: {}, replace: true });

  const belowCap = frames.length < FRAMES_CAP;

  return (
    <div>
      <SectionHeader
        eyebrow="Frames"
        title="The permanent portfolio."
        aside={
          isOwner ? (
            <div className="flex items-center gap-2">
              <span className="meta text-xs text-muted-foreground">
                {frames.length} / {FRAMES_CAP}
              </span>
              <Button
                size="sm"
                onClick={() => setCreating(true)}
                disabled={!belowCap}
                className="gap-2"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                New Frame
              </Button>
            </div>
          ) : (
            <span className="meta text-xs text-muted-foreground">
              {frames.length} {frames.length === 1 ? "frame" : "frames"}
            </span>
          )
        }
      />

      {framesQ.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : frames.length === 0 ? (
        <EmptyState
          icon={<FrameIcon strokeWidth={1.5} />}
          title={isOwner ? "Create your first Frame." : "This Gallery has no published Frames."}
          description={
            isOwner
              ? "Frames are your permanent portfolio — the photographs you want people to remember. Up to twenty-four."
              : "The photographer hasn't chosen any frames yet. Check back later."
          }
          action={
            isOwner ? (
              <Button onClick={() => setCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" strokeWidth={1.5} /> New Frame
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {frames.map((frame, idx) => (
            <li key={frame.id} className="relative">
              <FrameCard frame={frame} handle={handle} priority={idx === 0} />
              {isOwner && (
                <FrameOwnerMenu
                  frame={frame}
                  ownerId={owner.id}
                  index={idx}
                  total={frames.length}
                  onEdit={() => setEditing(frame)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (creating || editFrame) && (
        <FrameEditor
          open={true}
          onClose={() => {
            setCreating(false);
            if (search.new || search.photo || search.edit) clearSearch();
          }}
          ownerId={owner.id}
          handle={handle}
          frame={editFrame ?? undefined}
          presetCoverId={presetCoverId}
        />
      )}
      {isOwner && editing && (
        <FrameEditor
          open={true}
          onClose={() => setEditing(null)}
          ownerId={owner.id}
          handle={handle}
          frame={editing}
        />
      )}
    </div>
  );
}

function FrameOwnerMenu({
  frame,
  ownerId,
  index,
  total,
  onEdit,
}: {
  frame: Frame;
  ownerId: string;
  index: number;
  total: number;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["frames", "list", ownerId] });

  const swap = useMutation({
    mutationFn: async (dir: "up" | "down") => {
      const list =
        qc.getQueryData<Frame[]>(["frames", "list", ownerId, "owner"]) ?? [];
      const i = list.findIndex((f) => f.id === frame.id);
      if (i === -1) return;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      const a = list[i];
      const b = list[j];
      // Swap display_order values.
      const { error: e1 } = await supabase
        .from("frames")
        .update({ display_order: b.display_order })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("frames")
        .update({ display_order: a.display_order })
        .eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const setVisibility = useMutation({
    mutationFn: async (v: "draft" | "published") => {
      const { error } = await supabase
        .from("frames")
        .update({ visibility: v })
        .eq("id", frame.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      invalidate();
      toast.success(v === "published" ? "Frame published." : "Frame hidden.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("frames").delete().eq("id", frame.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Frame removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-[var(--shadow-soft)] backdrop-blur">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Manage frame ${frame.title}`}
              className="grid h-8 w-8 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={index === 0 || swap.isPending}
              onClick={() => swap.mutate("up")}
            >
              <ArrowUp className="mr-2 h-4 w-4" strokeWidth={1.5} /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={index === total - 1 || swap.isPending}
              onClick={() => swap.mutate("down")}
            >
              <ArrowDown className="mr-2 h-4 w-4" strokeWidth={1.5} /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {frame.visibility === "published" ? (
              <DropdownMenuItem onClick={() => setVisibility.mutate("draft")}>
                <EyeOff className="mr-2 h-4 w-4" strokeWidth={1.5} /> Hide (draft)
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setVisibility.mutate("published")}>
                <Eye className="mr-2 h-4 w-4" strokeWidth={1.5} /> Publish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Frame?</AlertDialogTitle>
            <AlertDialogDescription>
              The photograph stays in your library. Only the Frame is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}