import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

declare const __BUILD_COMMIT__: string;

// Poll index.html every PROBE_INTERVAL_MS, hashing the response. When the
// hash changes after the initial read, a new deploy is live — prompt to refresh.
// We use index.html because Vite rewrites its asset URLs on every build, so its
// content reliably changes between deploys with zero extra build config.
const PROBE_INTERVAL_MS = 60_000;
const INITIAL_DELAY_MS = 30_000;

const hashString = async (s: string): Promise<string> => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: simple non-crypto hash. Good enough for change detection.
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
};

const fetchIndexHash = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/index.html?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return hashString(text);
  } catch {
    return null;
  }
};

export const UpdateNotifier = () => {
  const initialHashRef = useRef<string | null>(null);
  const promptedRef = useRef(false);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    // Skip in dev — HMR handles updates and the dev server returns transformed HTML.
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

    const check = async () => {
      const hash = await fetchIndexHash();
      if (cancelled || !hash) return;
      if (initialHashRef.current === null) {
        initialHashRef.current = hash;
        return;
      }
      if (hash !== initialHashRef.current) {
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

  // Suppress unused warning for the build-time constant — referenced so future
  // deploys could swap to a /version.json strategy without import churn.
  void __BUILD_COMMIT__;

  return null;
};
