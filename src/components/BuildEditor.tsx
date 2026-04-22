import { useEffect, useState } from "react";
import { GripVertical, Save, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { NATURES } from "@/lib/natures";
import { fetchHeldItems, type PokemonFullDetail } from "@/lib/pokeapi";
import { BUILD_NAME_MAX, BUILD_NOTES_MAX } from "@/lib/builds";
import { cn } from "@/lib/utils";
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

/** Stable id per move slot so dnd-kit can identify rows even when value is empty. */
type MoveRow = { id: string; value: string };

const toRows = (moves: BuildDraft["moves"]): MoveRow[] =>
  moves.map((value, i) => ({ id: `move-${i}`, value }));

export const BuildEditor = ({ pokemon, initial, onSave, onCancel }: BuildEditorProps) => {
  const [draft, setDraft] = useState<BuildDraft>(() => initial ?? emptyDraft());
  const [items, setItems] = useState<string[]>([]);
  const [moveRows, setMoveRows] = useState<MoveRow[]>(() => toRows((initial ?? emptyDraft()).moves));

  useEffect(() => {
    fetchHeldItems().then(setItems).catch(() => setItems([]));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commitRows = (rows: MoveRow[]) => {
    setMoveRows(rows);
    setDraft((d) => ({
      ...d,
      moves: [rows[0].value, rows[1].value, rows[2].value, rows[3].value] as BuildDraft["moves"],
    }));
  };

  const setRowValue = (id: string, value: string) => {
    commitRows(moveRows.map((r) => (r.id === id ? { ...r, value } : r)));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = moveRows.findIndex((r) => r.id === active.id);
    const to = moveRows.findIndex((r) => r.id === over.id);
    if (from === -1 || to === -1) return;
    commitRows(arrayMove(moveRows, from, to));
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

      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Moves <span className="opacity-60 normal-case tracking-normal">(drag to reorder)</span>
        </Label>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={moveRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {moveRows.map((row, i) => (
                <SortableMoveRow
                  key={row.id}
                  row={row}
                  index={i}
                  options={moveOptions}
                  onChange={(v) => setRowValue(row.id, v)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

interface SortableMoveRowProps {
  row: MoveRow;
  index: number;
  options: string[];
  onChange: (v: string) => void;
}

const SortableMoveRow = ({ row, index, options, onChange }: SortableMoveRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md",
        isDragging && "z-30 shadow-card bg-card",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 grid h-8 w-6 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent cursor-grab active:cursor-grabbing touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Reorder move ${index + 1}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <Combobox
          value={row.value}
          onChange={onChange}
          options={options}
          placeholder={`Move ${index + 1}`}
          allowCustom
        />
      </div>
    </div>
  );
};
