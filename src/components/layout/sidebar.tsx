import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/tasks", label: "Tarefas", icon: "✅" },
  { to: "/calendar", label: "Calendário", icon: "📅" },
  { to: "/settings", label: "Configurações", icon: "⚙️" },
];

export default function Sidebar() {
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
    </aside>
  );
}
