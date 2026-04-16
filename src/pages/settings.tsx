import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Settings {
  id: number;
  notification_time: string;
  notification_sound_enabled: boolean;
  theme: string;
  default_view: string;
}

interface UpdateSettingsRequest {
  notification_time?: string;
  notification_sound_enabled?: boolean;
  theme?: string;
  default_view?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<Settings>("get_settings")
      .then(setSettings)
      .catch((err) => toast.error(`Erro ao carregar configurações: ${err}`))
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (request: UpdateSettingsRequest) => {
    try {
      const updated = await invoke<Settings>("update_settings", { request });
      setSettings(updated);
      toast.success("Configurações salvas");
    } catch (err) {
      toast.error(`Erro ao salvar: ${err}`);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4 max-w-lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 max-w-lg">
      <Toaster richColors />

      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As alterações são salvas automaticamente.
        </p>
      </div>

      {/* Notificações */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notificações</h2>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notification-time">Horário de notificação</Label>
            <p className="text-xs text-muted-foreground">
              Hora diária para receber o resumo de tarefas
            </p>
          </div>
          <Input
            id="notification-time"
            type="time"
            className="w-32"
            value={settings.notification_time.slice(0, 5)}
            onChange={(e) =>
              updateSettings({ notification_time: e.target.value })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notification-sound">Som de notificação</Label>
            <p className="text-xs text-muted-foreground">
              Reproduzir som ao receber notificações
            </p>
          </div>
          <Switch
            id="notification-sound"
            checked={settings.notification_sound_enabled}
            onCheckedChange={(checked) =>
              updateSettings({ notification_sound_enabled: checked })
            }
          />
        </div>
      </section>

      {/* Aparência */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Aparência</h2>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-select">Tema</Label>
            <p className="text-xs text-muted-foreground">
              Escolha entre claro, escuro ou seguir o sistema
            </p>
          </div>
          <Select
            value={settings.theme}
            onValueChange={(value) => value && updateSettings({ theme: value })}
          >
            <SelectTrigger id="theme-select" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Geral */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Geral</h2>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="default-view-select">Visualização padrão</Label>
            <p className="text-xs text-muted-foreground">
              Tela exibida ao abrir o Chronos
            </p>
          </div>
          <Select
            value={settings.default_view}
            onValueChange={(value) => value && updateSettings({ default_view: value })}
          >
            <SelectTrigger id="default-view-select" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="calendar_monthly">
                Calendário Mensal
              </SelectItem>
              <SelectItem value="calendar_weekly">
                Calendário Semanal
              </SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
    </div>
  );
}
