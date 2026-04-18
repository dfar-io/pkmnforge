import { useState } from "react";
import { Bookmark, BookmarkPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSavedTeams, type SavedTeam } from "@/hooks/useSavedTeams";
import { formatName, type PokemonDetail } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface SavedTeamsMenuProps {
  team: PokemonDetail[];
  onLoad: (members: PokemonDetail[]) => void;
}

export const SavedTeamsMenu = ({ team, onLoad }: SavedTeamsMenuProps) => {
  const { teams, saveNew, overwrite, rename, remove } = useSavedTeams();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const canSave = team.length > 0;

  const handleSave = () => {
    const created = saveNew(name, team);
    if (!created) {
      toast.error("Give your team a name first");
      return;
    }
    toast.success(`Saved "${created.name}"`);
    setName("");
    setSaveOpen(false);
  };

  const handleOverwrite = (t: SavedTeam) => {
    if (team.length === 0) {
      toast.error("Build a team first");
      return;
    }
    const updated = overwrite(t.id, team);
    if (updated) toast.success(`Updated "${updated.name}"`);
  };

  const handleLoad = (t: SavedTeam) => {
    onLoad(t.members);
    toast.success(`Loaded "${t.name}"`);
    setLoadOpen(false);
  };

  const handleRename = (id: string) => {
    const updated = rename(id, renameValue);
    if (!updated) {
      toast.error("Name can't be empty");
      return;
    }
    toast.success(`Renamed to "${updated.name}"`);
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = (t: SavedTeam) => {
    remove(t.id);
    toast.success(`Deleted "${t.name}"`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!canSave) {
            toast.error("Build a team first");
            return;
          }
          setSaveOpen(true);
        }}
        className="text-muted-foreground hover:text-primary"
        aria-label="Save current team"
      >
        <BookmarkPlus className="h-4 w-4 mr-1" />
        Save
      </Button>

      <DropdownMenu open={loadOpen} onOpenChange={setLoadOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            aria-label="Load a saved team"
          >
            <Bookmark className="h-4 w-4 mr-1" />
            Load
            {teams.length > 0 && (
              <span className="ml-1 text-[10px] font-mono text-muted-foreground">
                {teams.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-[60vh] overflow-y-auto">
          <DropdownMenuLabel>Saved teams</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {teams.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              No saved teams yet.
              <br />
              Build a team and tap Save.
            </div>
          ) : (
            teams.map((t) => (
              <div key={t.id} className="px-1.5 py-1">
                {renamingId === t.id ? (
                  <div className="flex items-center gap-1.5 px-1">
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(t.id);
                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setRenameValue("");
                        }
                      }}
                      className="h-7 text-xs"
                      maxLength={60}
                    />
                    <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleRename(t.id)}>
                      OK
                    </Button>
                  </div>
                ) : (
                  <DropdownMenuItem
                    className="flex flex-col items-stretch gap-1.5 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLoad(t);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-sm truncate">
                        {t.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {t.members.length}/6
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {t.members.map((m) => (
                        <img
                          key={m.id}
                          src={m.sprite}
                          alt={formatName(m.name)}
                          loading="lazy"
                          className="h-7 w-7 rounded-full bg-secondary/60 object-contain"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOverwrite(t);
                        }}
                        className={cn(
                          "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded hover:bg-secondary transition-colors",
                          team.length === 0
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-muted-foreground hover:text-primary",
                        )}
                        disabled={team.length === 0}
                      >
                        Overwrite
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(t.id);
                          setRenameValue(t.name);
                        }}
                        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors inline-flex items-center gap-1"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t);
                        }}
                        className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Delete
                      </button>
                    </div>
                  </DropdownMenuItem>
                )}
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save team</DialogTitle>
            <DialogDescription>
              Give this team a name so you can load it later.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="e.g. Rain team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            maxLength={60}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
