import { useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type BuildDraft } from "@/hooks/useBuilds";
import { parseShowdownSet } from "@/lib/showdown";
import { formatName, type PokemonFullDetail } from "@/lib/pokeapi";
import { BUILD_NOTES_MAX } from "@/lib/builds";

interface ImportShowdownDialogProps {
  pokemon: PokemonFullDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (draft: BuildDraft) => void;
}

const PLACEHOLDER = `Gyarados @ Heavy-Duty Boots
Ability: Intimidate
Tera Type: Flying
EVs: 248 HP / 56 Def / 204 Spe
Jolly Nature
- Waterfall
- Earthquake
- Dragon Dance
- Taunt`;

const buildNotesFromExtras = (extras: string[], displayName: string): string => {
  const head = `Imported from Smogon/Showdown${
    displayName ? ` as "${displayName}"` : ""
  }.`;
  const body = extras.length ? extras.join("\n") : "";
  return [head, body].filter(Boolean).join("\n").slice(0, BUILD_NOTES_MAX);
};

export const ImportShowdownDialog = ({
  pokemon,
  open,
  onOpenChange,
  onImport,
}: ImportShowdownDialogProps) => {
  const [text, setText] = useState("");

  const handleImport = () => {
    let parsed;
    try {
      parsed = parseShowdownSet(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't parse paste");
      return;
    }

    // Soft species check — warn but don't block, since renamed forms or
    // nicknames can throw off the match (e.g. "Urshifu-Rapid-Strike").
    const expected = pokemon.name.toLowerCase();
    const got = parsed.species.toLowerCase();
    const speciesMatches = got === expected || got.startsWith(expected) || expected.startsWith(got);
    if (!speciesMatches) {
      toast.warning(
        `Set looks like ${formatName(parsed.species)}, importing onto ${formatName(pokemon.name)} anyway.`,
      );
    }

    const draft: BuildDraft = {
      name: parsed.displayName && parsed.displayName.toLowerCase() !== parsed.species
        ? parsed.displayName
        : "Smogon import",
      ability: parsed.ability,
      item: parsed.item,
      natureId: parsed.natureId,
      moves: parsed.moves,
      notes: buildNotesFromExtras(parsed.extras, parsed.displayName),
    };
    onImport(draft);
    toast.success(`Imported "${draft.name}"`);
    setText("");
    onOpenChange(false);
  };

  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      toast.error("Clipboard access blocked");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setText("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Smogon</DialogTitle>
          <DialogDescription>
            Paste a Pokémon Showdown set — the same text block Smogon analysis
            pages provide under "Export". EVs, IVs, and Tera Type are saved into
            notes (Pokénex doesn't model those yet).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="font-mono text-xs h-48 resize-none"
        />
        <div className="flex justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePasteClipboard}
            className="text-muted-foreground"
          >
            <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
            Paste from clipboard
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            <Download className="h-4 w-4 mr-1.5" />
            Import build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
