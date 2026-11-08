mod binary;
mod fonts;
mod system_ocr;

#[tauri::command]
fn app_minimize(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn app_toggle_maximize(window: tauri::Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn app_close(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(system_ocr::Jobs::default())
        .invoke_handler(tauri::generate_handler![
            system_ocr::system_ocr_status,
            system_ocr::system_ocr_recognize,
            fonts::list_system_fonts,
            fonts::read_system_font,
            app_minimize,
            app_toggle_maximize,
            app_close,
        ])
        .run(tauri::generate_context!())
        .expect("CAN PDF 启动失败");
}
