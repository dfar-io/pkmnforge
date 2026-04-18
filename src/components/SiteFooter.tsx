import { GitCommit, Clock } from "lucide-react";

// Build-time constants injected via Vite `define` (see vite.config.ts).
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;
declare const __REPO_URL__: string;

const COMMIT = __BUILD_COMMIT__;
const BUILD_TIME = __BUILD_TIME__;
const REPO_URL = __REPO_URL__;

const shortSha = COMMIT && COMMIT !== "dev" ? COMMIT.slice(0, 7) : "dev";
const commitHref =
  COMMIT && COMMIT !== "dev" ? `${REPO_URL}/commit/${COMMIT}` : REPO_URL;

const formatBuildTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const SiteFooter = () => {
  return (
    <footer className="mt-10 border-t border-border/60 bg-background/60">
      <div className="max-w-2xl mx-auto px-4 py-5 text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
        </div>
      </div>
    </footer>
  );
};
