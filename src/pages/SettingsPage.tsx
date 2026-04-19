import { useEffect, useRef, useState } from "react";
import { Download, Upload, AlertTriangle, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBuilds } from "@/hooks/useBuilds";
import { useSavedTeams } from "@/hooks/useSavedTeams";
import {
  buildBackup,
  downloadJson,
  formatBackupFilename,
  mergeById,
  parseBackup,
  type ParsedBackup,
} from "@/lib/backup";

type ImportMode = "merge" | "replace";

const SettingsPage = () => {
  const { builds, replaceAll: replaceBuilds } = useBuilds();
  const { teams, replaceAll: replaceTeams } = useSavedTeams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    parsed: ParsedBackup;
    filename: string;
  } | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");

  useEffect(() => {
    document.title = "Settings – Pokénex";
  }, []);

  const handleExport = () => {
    if (builds.length === 0 && teams.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const data = buildBackup(builds, teams);
    downloadJson(formatBackupFilename(), data);
    toast.success("Backup downloaded");
  };

  const handlePickFile = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseBackup(text);
      if (parsed.builds.length === 0 && parsed.savedTeams.length === 0) {
        toast.error("Backup is empty");
        return;
      }
      setMode("merge");
      setPending({ parsed, filename: file.name });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't read backup file",
      );
    }
  };

  const performImport = () => {
    if (!pending) return;
    const { parsed } = pending;
    if (mode === "replace") {
      replaceBuilds(parsed.builds);
      replaceTeams(parsed.savedTeams);
    } else {
      replaceBuilds(mergeById(builds, parsed.builds));
      replaceTeams(mergeById(teams, parsed.savedTeams));
    }
    const skipNote =
      parsed.skipped.builds + parsed.skipped.savedTeams > 0
        ? ` (skipped ${parsed.skipped.builds + parsed.skipped.savedTeams} invalid)`
        : "";
    toast.success(
      `Imported ${parsed.builds.length} builds and ${parsed.savedTeams.length} teams${skipNote}`,
    );
    setPending(null);
  };

  return (
    <>
      <section className="space-y-4">
        <header>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Back up your builds and saved teams, or restore from a previous
            export.
          </p>
        </header>

        <div className="rounded-2xl bg-gradient-card shadow-card p-4 space-y-4">
          <h3 className="font-display text-lg font-bold">Your data</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<Package className="h-4 w-4" />}
              label="Builds"
              value={builds.length}
            />
            <Stat
              icon={<Users className="h-4 w-4" />}
              label="Saved teams"
              value={teams.length}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-card shadow-card p-4 space-y-3">
          <div>
            <h3 className="font-display text-lg font-bold">Export</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Downloads a JSON file containing every build and saved team.
              Favorites and the active team aren't included.
            </p>
          </div>
          <Button onClick={handleExport} className="w-full" variant="default">
            <Download className="h-4 w-4 mr-2" />
            Export backup
          </Button>
        </div>

        <div className="rounded-2xl bg-gradient-card shadow-card p-4 space-y-3">
          <div>
            <h3 className="font-display text-lg font-bold">Import</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Restore a previously exported Pokénex backup. You'll be asked
              whether to merge or replace.
            </p>
          </div>
          <Button onClick={handlePickFile} className="w-full" variant="secondary">
            <Upload className="h-4 w-4 mr-2" />
            Choose backup file…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
      </section>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import backup</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-foreground font-medium">
                    {pending?.filename}
                  </span>{" "}
                  contains{" "}
                  <span className="text-foreground font-medium">
                    {pending?.parsed.builds.length} builds
                  </span>{" "}
                  and{" "}
                  <span className="text-foreground font-medium">
                    {pending?.parsed.savedTeams.length} saved teams
                  </span>
                  .
                </p>
                {pending &&
                  pending.parsed.skipped.builds +
                    pending.parsed.skipped.savedTeams >
                    0 && (
                    <p className="flex items-start gap-2 text-amber-500">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {pending.parsed.skipped.builds +
                          pending.parsed.skipped.savedTeams}{" "}
                        invalid item(s) will be skipped.
                      </span>
                    </p>
                  )}
                <fieldset className="space-y-2 pt-1">
                  <ModeOption
                    checked={mode === "merge"}
                    onChange={() => setMode("merge")}
                    title="Merge"
                    desc="Add new builds & teams, overwrite any with matching IDs. Existing items not in the backup are kept."
                  />
                  <ModeOption
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                    title="Replace"
                    desc="Discard everything currently saved and use only the backup. Cannot be undone."
                  />
                </fieldset>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performImport}
              className={
                mode === "replace"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {mode === "replace" ? "Replace data" : "Merge data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="rounded-xl bg-background/50 border border-border/60 p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      {icon}
      <span>{label}</span>
    </div>
    <p className="font-display text-2xl font-extrabold mt-1 tabular-nums">
      {value}
    </p>
  </div>
);

const ModeOption = ({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) => (
  <label
    className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
      checked
        ? "border-primary bg-primary/5"
        : "border-border/60 hover:border-border"
    }`}
  >
    <input
      type="radio"
      name="import-mode"
      checked={checked}
      onChange={onChange}
      className="mt-1 accent-primary"
    />
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </label>
);

export default SettingsPage;
