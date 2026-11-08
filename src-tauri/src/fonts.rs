use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct SystemFont {
    id: String,
    name: String,
}

#[cfg(windows)]
fn installed_fonts() -> Vec<SystemFont> {
    use std::{collections::HashSet, path::PathBuf};
    use winreg::{
        enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE},
        RegKey,
    };

    let mut found = Vec::new();
    let mut seen = HashSet::new();
    for (hive, user) in [(HKEY_LOCAL_MACHINE, false), (HKEY_CURRENT_USER, true)] {
        let Ok(key) = RegKey::predef(hive)
            .open_subkey(r"Software\Microsoft\Windows NT\CurrentVersion\Fonts")
        else {
            continue;
        };
        for name in key.enum_values().filter_map(Result::ok).map(|item| item.0) {
            let Ok(value) = key.get_value::<String, _>(&name) else {
                continue;
            };
            let file = PathBuf::from(&value);
            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or_default();
            if !extension.eq_ignore_ascii_case("ttf") && !extension.eq_ignore_ascii_case("otf") {
                continue;
            }
            let path = if file.is_absolute() {
                file
            } else if user {
                let Some(local) = std::env::var_os("LOCALAPPDATA") else {
                    continue;
                };
                PathBuf::from(local)
                    .join("Microsoft")
                    .join("Windows")
                    .join("Fonts")
                    .join(file)
            } else {
                let Some(windir) = std::env::var_os("WINDIR") else {
                    continue;
                };
                PathBuf::from(windir).join("Fonts").join(file)
            };
            let Ok(path) = path.canonicalize() else {
                continue;
            };
            let id = path.to_string_lossy().into_owned();
            if !seen.insert(id.to_lowercase()) {
                continue;
            }
            let display = name
                .trim_end_matches(" (TrueType)")
                .trim_end_matches(" (OpenType)")
                .to_owned();
            found.push(SystemFont { id, name: display });
        }
    }
    found.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    found
}

#[tauri::command]
pub fn list_system_fonts() -> Vec<SystemFont> {
    #[cfg(windows)]
    {
        installed_fonts()
    }
    #[cfg(not(windows))]
    {
        Vec::new()
    }
}

#[tauri::command]
pub fn read_system_font(id: String) -> Result<Vec<u8>, String> {
    #[cfg(windows)]
    {
        use std::fs;
        if !installed_fonts().iter().any(|font| font.id == id) {
            return Err("请选择已安装的本机字体。".into());
        }
        let metadata = fs::metadata(&id).map_err(|error| error.to_string())?;
        if metadata.len() > 64 * 1024 * 1024 {
            return Err("该字体文件过大，无法嵌入 PDF。".into());
        }
        fs::read(&id).map_err(|error| error.to_string())
    }
    #[cfg(not(windows))]
    {
        let _ = id;
        Err("当前系统尚不支持读取本机字体。".into())
    }
}
