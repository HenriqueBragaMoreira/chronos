import { NavLink } from "react-router";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/contexts/theme-context";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/tasks", label: "Tarefas", icon: "✅" },
  { to: "/calendar", label: "Calendário", icon: "📅" },
  { to: "/settings", label: "Configurações", icon: "⚙️" },
];

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") return <SunIcon className="size-4" />;
  if (theme === "dark") return <MoonIcon className="size-4" />;
  return <MonitorIcon className="size-4" />;
}

export default function Sidebar() {
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
    setTheme(next);
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Chronos</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={cycleTheme}
          title={`Tema: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"} — clique para alternar`}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <ThemeIcon theme={theme} />
          <span>
            {theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}
          </span>
        </button>
      </div>
    </aside>
  );
}
