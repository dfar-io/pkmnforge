import { GitCommit, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BUILD_COMMIT, BUILD_TIME, REPO_URL } from "@/build-info";
import { clearPokeapiCaches } from "@/lib/pokeapi";

const shortSha =
  BUILD_COMMIT && BUILD_COMMIT !== "dev" ? BUILD_COMMIT.slice(0, 7) : "dev";
const commitHref =
  BUILD_COMMIT && BUILD_COMMIT !== "dev"
    ? `${REPO_URL}/commit/${BUILD_COMMIT}`
    : REPO_URL;

const formatBuildTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

const handleClearCache = () => {
  const { items, pokemon } = clearPokeapiCaches();
  if (items === 0 && pokemon === 0) {
    toast.success("Cache already empty");
  } else {
    toast.success(
      `Cleared ${pokemon} Pokémon ${pokemon === 1 ? "entry" : "entries"}` +
        (items ? " + items list" : ""),
    );
  }
};

export const SiteFooter = () => {
  return (
    <footer className="mt-10 border-t border-border/60 bg-background/60">
      <div className="max-w-2xl mx-auto px-4 py-5 text-[11px] text-muted-foreground flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-6">
        <p>
          Created by{" "}
          <a
            href="https://dfar.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display font-bold text-foreground hover:text-primary transition-colors"
          >
            Dave Farinelli
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href={commitHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors font-mono"
            title="View commit on GitHub"
          >
            <GitCommit className="h-3 w-3" />
            {shortSha}
          </a>
          <span
            className="inline-flex items-center gap-1"
            title={`Built ${BUILD_TIME}`}
          >
            <Clock className="h-3 w-3" />
            {formatBuildTime(BUILD_TIME)}
          </span>
          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-1 hover:text-destructive transition-colors"
            title="Wipe cached PokeAPI data (items + per-Pokémon details)"
          >
            <Trash2 className="h-3 w-3" />
            Clear cache
          </button>
        </div>
      </div>
    </footer>
  );
};
