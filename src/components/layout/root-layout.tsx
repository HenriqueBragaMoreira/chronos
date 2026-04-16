import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { listen } from "@tauri-apps/api/event";
import Sidebar from "./sidebar";

export default function RootLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = listen<string>("navigate-to", (event) => {
      navigate(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
