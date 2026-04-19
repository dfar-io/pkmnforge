import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatName } from "@/lib/pokeapi";

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Called only after the user selects (not while typing). */
  triggerLabel?: string;
  /** When true, the user can commit the typed query as a custom value. */
  allowCustom?: boolean;
}

const MAX_VISIBLE = 80;

/**
 * Headless searchable combobox over a string list. We deliberately don't use
 * `cmdk` directly because the option set can be 800+ moves and `cmdk` does
 * substring scoring on every keystroke, which is wasteful for our use.
 */
export const Combobox = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyText = "No matches",
  disabled,
  triggerLabel,
  allowCustom = false,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commitCustom = () => {
    const v = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    onChange(v);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!q) return options.slice(0, MAX_VISIBLE);
    // Match against both the raw name ("thunder-punch") and a space form
    // ("thunder punch") so users can type either way.
    const list = options.filter((o) => {
      const raw = o.toLowerCase();
      return raw.includes(q) || raw.replace(/-/g, " ").includes(q.replace(/-/g, " "));
    });
    return list.slice(0, MAX_VISIBLE);
  }, [options, query]);

  const display = value ? formatName(value) : (triggerLabel ?? placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{display}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="relative border-b border-border">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-9 pl-8 border-0 focus-visible:ring-0 rounded-none bg-transparent"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-1">
          {value && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/60"
              >
                Clear selection
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-center text-xs text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            filtered.map((opt) => {
              const selected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-left hover:bg-secondary/60",
                      selected && "bg-secondary/40 font-semibold",
                    )}
                  >
                    <span className="truncate">{formatName(opt)}</span>
                    {selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
          {options.length > MAX_VISIBLE && filtered.length === MAX_VISIBLE && (
            <li className="px-3 py-2 text-center text-[10px] text-muted-foreground/70">
              Showing first {MAX_VISIBLE} — refine your search
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
