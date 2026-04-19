import { NavLink } from "react-router-dom";
import { Layers, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Team", icon: Layers, end: true },
  { to: "/pokedex", label: "Pokédex", icon: BookOpen, end: false },
];

export const BottomTabBar = () => (
  <nav
    aria-label="Primary"
    className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
  >
    <ul className="max-w-2xl mx-auto grid grid-cols-2">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-display font-semibold uppercase tracking-wide transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110",
                  )}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
