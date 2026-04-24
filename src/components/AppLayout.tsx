import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SiteFooter } from "@/components/SiteFooter";

const SHORTCUTS: Record<string, string> = {
  p: "/pokedex",
  t: "/",
  s: "/settings",
};

const AppLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const path = SHORTCUTS[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        navigate(path);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        <Outlet />
      </main>
      <SiteFooter />
      <BottomTabBar />
    </div>
  );
};

export default AppLayout;
