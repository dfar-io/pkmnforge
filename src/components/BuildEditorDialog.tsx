import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BuildEditor } from "@/components/BuildEditor";
import { formatName, type PokemonFullDetail } from "@/lib/pokeapi";
import type { BuildDraft } from "@/hooks/useBuilds";

interface BuildEditorDialogProps {
  pokemon: PokemonFullDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: BuildDraft;
  onSave: (draft: BuildDraft) => void;
  title?: string;
}

export const BuildEditorDialog = ({
  pokemon,
  open,
  onOpenChange,
  initial,
  onSave,
  title,
}: BuildEditorDialogProps) => {
  const handleSave = (draft: BuildDraft) => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base font-display">
            {title ?? `New build — ${formatName(pokemon.name)}`}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          {open && (
            <BuildEditor
              pokemon={pokemon}
              initial={initial}
              onSave={handleSave}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
