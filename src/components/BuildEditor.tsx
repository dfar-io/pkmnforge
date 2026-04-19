import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { NATURES } from "@/lib/natures";
import { fetchHeldItems, type PokemonFullDetail } from "@/lib/pokeapi";
import { BUILD_NAME_MAX, BUILD_NOTES_MAX } from "@/lib/builds";
import {
  emptyDraft,
  type BuildDraft,
} from "@/hooks/useBuilds";

interface BuildEditorProps {
  pokemon: PokemonFullDetail;
  initial?: BuildDraft;
  onSave: (draft: BuildDraft) => void;
  onCancel: () => void;
}

const NATURE_OPTIONS = NATURES.map((n) => n.id);

export const BuildEditor = ({ pokemon, initial, onSave, onCancel }: BuildEditorProps) => {
  const [draft, setDraft] = useState<BuildDraft>(() => initial ?? emptyDraft());
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    fetchHeldItems().then(setItems).catch(() => setItems([]));
  }, []);

  const setMove = (idx: 0 | 1 | 2 | 3, value: string) => {
    setDraft((d) => {
      const moves = [...d.moves] as [string, string, string, string];
      moves[idx] = value;
      return { ...d, moves };
    });
  };

  const abilityOptions = pokemon.abilities.map((a) => a.name);
  const moveOptions = [...pokemon.moves].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-3">
      <div>
        <Label htmlFor="build-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Build name
        </Label>
        <Input
          id="build-name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Choice Scarf sweeper"
          maxLength={BUILD_NAME_MAX}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Ability
        </Label>
        <div className="mt-1">
          <Combobox
            value={draft.ability}
            onChange={(v) => setDraft({ ...draft, ability: v })}
            options={abilityOptions}
            placeholder="Pick ability"
          />
        </div>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Nature
        </Label>
        <div className="mt-1">
          <Combobox
            value={draft.natureId}
            onChange={(v) => setDraft({ ...draft, natureId: v })}
            options={NATURE_OPTIONS}
            placeholder="Pick nature"
          />
        </div>
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Held item
        </Label>
        <div className="mt-1">
          <Combobox
            value={draft.item}
            onChange={(v) => setDraft({ ...draft, item: v })}
            options={items}
            placeholder={items.length ? "Pick item" : "Loading items…"}
            disabled={items.length === 0}
            allowCustom
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Moves
        </Label>
        {[0, 1, 2, 3].map((i) => (
          <Combobox
            key={i}
            value={draft.moves[i]}
            onChange={(v) => setMove(i as 0 | 1 | 2 | 3, v)}
            options={moveOptions}
            placeholder={`Move ${i + 1}`}
            allowCustom
          />
        ))}
      </div>

      <div>
        <Label htmlFor="build-notes" className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Notes
        </Label>
        <Textarea
          id="build-notes"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          rows={3}
          maxLength={BUILD_NOTES_MAX}
          placeholder="EV spread, role, lead vs. switch-in tips…"
          className="mt-1 resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-1">
          {draft.notes.length}/{BUILD_NOTES_MAX}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(draft)}>
          <Save className="h-4 w-4 mr-1" />
          Save build
        </Button>
      </div>
    </div>
  );
};
