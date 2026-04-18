import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "child_process";

// Resolve the current commit SHA at build time. Lovable's build environment
// shadows the `git` binary, so prefer `__LOVABLE_REAL_GIT` when present.
// Falls back to common CI env vars and finally "dev".
const resolveCommitSha = (): string => {
  const gitBin = process.env.__LOVABLE_REAL_GIT || "git";
  try {
    return execSync(`${gitBin} rev-parse HEAD`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.COMMIT_REF ||
      process.env.GITHUB_SHA ||
      "dev"
    );
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  define: {
    __BUILD_COMMIT__: JSON.stringify(resolveCommitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __REPO_URL__: JSON.stringify("https://github.com/dfar-io/pkmnforge"),
  },
}));
