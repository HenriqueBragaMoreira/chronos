use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager, WindowEvent,
};

/// Intercepts the window close button so the app hides to tray instead of quitting.
pub fn setup_minimize_to_tray(app: &App) {
    if let Some(window) = app.get_webview_window("main") {
        let window_for_hide = window.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window_for_hide.hide();
            }
        });
    }
}

pub fn setup_tray(app: &App) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, "open", "Abrir Chronos", true, None::<&str>)?;
    let today_item =
        MenuItem::with_id(app, "today", "Tarefas de Hoje", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_item, &today_item, &separator, &quit_item])?;

    let mut builder = TrayIconBuilder::with_id("main-tray").menu(&menu);

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "today" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app.emit("navigate-to", "/tasks?filter=today");
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
