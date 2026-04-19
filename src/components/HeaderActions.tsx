import { useState } from "react";
import { Check, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PokemonDetail } from "@/lib/pokeapi";

interface HeaderActionsProps {
  team: PokemonDetail[];
  onShare: () => void;
  onClear: () => void;
  justCopied: boolean;
}

// Inline buttons on sm+, single overflow menu on mobile.
export const HeaderActions = ({ team, onShare, onClear, justCopied }: HeaderActionsProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const hasTeam = team.length > 0;

  return (
    <>
      {/* Desktop / tablet: inline buttons */}
      <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end">
        {hasTeam && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-muted-foreground hover:text-primary"
              aria-label="Copy shareable team link"
            >
              {justCopied ? (
                <Check className="h-4 w-4 mr-1 text-success" />
              ) : (
                <Share2 className="h-4 w-4 mr-1" />
              )}
              {justCopied ? "Copied" : "Share"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Mobile: single overflow menu */}
      <div className="sm:hidden">
        <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              aria-label="Team actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {hasTeam && (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setOverflowOpen(false);
                    onShare();
                  }}
                >
                  {justCopied ? (
                    <Check className="h-4 w-4 mr-2 text-success" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  {justCopied ? "Copied" : "Share link"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    setOverflowOpen(false);
                    onClear();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear team
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
