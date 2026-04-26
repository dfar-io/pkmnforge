import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NATURES } from "@/lib/natures";
import {
  BUILD_NAME_MAX,
  BUILD_NOTES_MAX,
  EMPTY_MOVES,
  type PokemonBuild,
} from "@/lib/builds";
import { emptyDraft, type BuildDraft } from "@/hooks/useBuilds";

interface CustomBuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PokemonBuild;
  onSubmit: (draft: BuildDraft) => void;
  title?: string;
}

const draftFromBuild = (b: PokemonBuild): BuildDraft => ({
  name: b.name,
  ability: b.ability,
  item: b.item,
  natureId: b.natureId,
  moves: [...b.moves] as [string, string, string, string],
  notes: b.notes,
});

/**
 * Lightweight editor for hand-rolled builds. Intentionally minimal — just
 * free-text fields for ability/item/moves so users can capture sets that
 * Smogon doesn't publish, without us shipping a full autocomplete index.
 */
export const CustomBuildDialog = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: CustomBuildDialogProps) => {
  const [draft, setDraft] = useState<BuildDraft>(() =>
    initial ? draftFromBuild(initial) : emptyDraft(),
  );

  // Reset when (re)opened so each session starts from the source of truth.
  useEffect(() => {
    if (open) setDraft(initial ? draftFromBuild(initial) : emptyDraft());
  }, [open, initial]);

  const setMove = (i: number, value: string) => {
    setDraft((d) => {
      const moves = [...d.moves] as [string, string, string, string];
      moves[i] = value;
      return { ...d, moves };
    });
  };

  const handleSave = () => {
    onSubmit(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? (initial ? "Edit build" : "New custom build")}</DialogTitle>
          <DialogDescription>
            Capture your own set when Smogon doesn't have what you need.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="build-name">Name</Label>
            <Input
              id="build-name"
              maxLength={BUILD_NAME_MAX}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Bulky Pivot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="build-ability">Ability</Label>
              <Input
                id="build-ability"
                value={draft.ability}
                onChange={(e) => setDraft((d) => ({ ...d, ability: e.target.value }))}
                placeholder="intimidate"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="build-item">Item</Label>
              <Input
                id="build-item"
                value={draft.item}
                onChange={(e) => setDraft((d) => ({ ...d, item: e.target.value }))}
                placeholder="leftovers"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Nature</Label>
            <Select
              value={draft.natureId || "none"}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, natureId: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a nature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {NATURES.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name} (+{n.up.toUpperCase()} / −{n.down.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Moves</Label>
            <div className="grid grid-cols-2 gap-2">
              {EMPTY_MOVES.map((_, i) => (
                <Input
                  key={i}
                  value={draft.moves[i]}
                  onChange={(e) => setMove(i, e.target.value)}
                  placeholder={`Move ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="build-notes">Notes</Label>
            <Textarea
              id="build-notes"
              maxLength={BUILD_NOTES_MAX}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="EV spread, tera type, role…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{initial ? "Save changes" : "Create build"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};