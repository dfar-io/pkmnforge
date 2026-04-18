import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Poll /version.json every PROBE_INTERVAL_MS. Vite emits this file at build
// time with the current commit SHA — when it changes, a new deploy is live.
const PROBE_INTERVAL_MS = 60_000;
const INITIAL_DELAY_MS = 30_000;

const fetchDeployedCommit = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { commit?: string };
    return typeof data.commit === "string" ? data.commit : null;
  } catch {
    return null;
  }
};

export const UpdateNotifier = () => {
  const initialCommitRef = useRef<string | null>(null);
  const promptedRef = useRef(false);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    // Skip in dev — HMR handles updates and there's no built version.json.
    if (import.meta.env.DEV) return;

    let cancelled = false;
    let intervalId: number | undefined;

    const promptRefresh = () => {
      if (promptedRef.current) return;
      promptedRef.current = true;
      toastIdRef.current = toast("A new version is available", {
        description: "Refresh to load the latest update.",
        duration: Infinity,
        action: (
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            className="font-display font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        ),
      });
    };

    // Capture the deployed commit at first load, then prompt only when a
    // later poll observes a different value. This avoids false positives
    // caused by the baked-in BUILD_COMMIT lagging behind the publish SHA.
    const check = async () => {
      const deployed = await fetchDeployedCommit();
      if (cancelled || !deployed) return;
      if (initialCommitRef.current === null) {
        initialCommitRef.current = deployed;
        return;
      }
      if (deployed !== initialCommitRef.current) {
        promptRefresh();
        if (intervalId) window.clearInterval(intervalId);
      }
    };

    // Re-check when the tab becomes visible again — common case for stale tabs.
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const startTimer = window.setTimeout(() => {
      void check();
      intervalId = window.setInterval(() => void check(), PROBE_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current);
    };
  }, []);

  return null;
};
