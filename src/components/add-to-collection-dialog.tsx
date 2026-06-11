import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Check, Layers, Plus } from "lucide-react";
import { toast } from "sonner";

export function AddToCollectionDialog({
  open,
  onClose,
  photoId,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  photoId: string;
  ownerId: string;
}) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const colsQ = useQuery({
    queryKey: ["my-collections", ownerId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,name")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const memberQ = useQuery({
    queryKey: ["photo-collections", photoId, ownerId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_photos")
        .select("collection_id, collections!inner(owner_id)")
        .eq("photo_id", photoId)
        .eq("collections.owner_id", ownerId);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.collection_id));
    },
  });

  useEffect(() => { if (!open) { setCreating(false); setNewName(""); } }, [open]);

  const toggle = async (cid: string) => {
    setBusy(cid);
    const isMember = memberQ.data?.has(cid);
    if (isMember) {
      await supabase.from("collection_photos").delete().eq("collection_id", cid).eq("photo_id", photoId);
    } else {
      await supabase.from("collection_photos").insert({ collection_id: cid, photo_id: photoId });
    }
    setBusy(null);
    qc.invalidateQueries({ queryKey: ["photo-collections", photoId, ownerId] });
    qc.invalidateQueries({ queryKey: ["collection-photos", cid] });
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy("__new");
    const ins = await supabase.from("collections").insert({ owner_id: ownerId, name }).select("id").single();
    if (ins.error) { setBusy(null); return toast.error(ins.error.message); }
    await supabase.from("collection_photos").insert({ collection_id: ins.data.id, photo_id: photoId });
    setBusy(null);
    setNewName("");
    setCreating(false);
    qc.invalidateQueries({ queryKey: ["my-collections", ownerId] });
    qc.invalidateQueries({ queryKey: ["photo-collections", photoId, ownerId] });
    toast.success("Added to new collection.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add to collection</DialogTitle></DialogHeader>
        <div className="max-h-72 overflow-y-auto">
          {colsQ.isLoading ? (
            <div className="h-20 animate-pulse rounded-md bg-muted" />
          ) : colsQ.data && colsQ.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {colsQ.data.map((c) => {
                const inIt = memberQ.data?.has(c.id) ?? false;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      disabled={busy === c.id}
                      className="flex w-full items-center justify-between px-1 py-3 text-left text-sm transition-colors hover:text-foreground"
                    >
                      <span className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        {c.name}
                      </span>
                      {inIt && <Check className="h-4 w-4" strokeWidth={1.5} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-1 py-6 text-sm text-muted-foreground">No collections yet.</p>
          )}
        </div>

        {creating ? (
          <form onSubmit={create} className="flex gap-2 pt-2">
            <Input autoFocus placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} />
            <Button type="submit" disabled={busy === "__new" || !newName.trim()}>Create</Button>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setCreating(true)} className="gap-2"><Plus className="h-4 w-4" /> New collection</Button>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}