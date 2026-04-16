import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/contexts/theme-context";
import RootLayout from "@/components/layout/root-layout";
import DashboardPage from "@/pages/dashboard";
import TasksPage from "@/pages/tasks";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
