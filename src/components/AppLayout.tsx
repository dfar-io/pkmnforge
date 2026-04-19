import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SiteFooter } from "@/components/SiteFooter";

const AppLayout = () => (
  <div className="min-h-screen bg-background pb-24">
    <AppHeader />
    <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
      <Outlet />
    </main>
    <SiteFooter />
    <BottomTabBar />
  </div>
);

export default AppLayout;
