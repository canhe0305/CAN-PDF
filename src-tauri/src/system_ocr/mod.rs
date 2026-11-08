use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
use windows as platform;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
use macos as platform;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub engine: String,
    pub languages: Vec<String>,
    pub max_dimension: u32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    pub width: u32,
    pub height: u32,
    pub language: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Line {
    pub text: String,
    pub confidence: Option<f64>,
    pub x0: f64,
    pub y0: f64,
    pub x1: f64,
    pub y1: f64,
}

// Keep the guard inside the blocking task. Closing a dialog may stop waiting,
// but must never permit overlapping native recognition jobs to accumulate.
#[derive(Default)]
pub struct Jobs(Arc<Mutex<()>>);

fn validate(request: &Request, pixels: &[u8]) -> Result<(), String> {
    let count = u64::from(request.width) * u64::from(request.height);
    if count == 0
        || count > 6_000_000
        || request.width > 8192
        || request.height > 8192
        || count * 4 != pixels.len() as u64
    {
        return Err("系统 OCR 图像尺寸无效。".into());
    }
    if !["eng", "chi_sim+eng"].contains(&request.language.as_str()) {
        return Err("不支持的识别语言。".into());
    }
    Ok(())
}

fn checked_lines(lines: Vec<Line>, request: &Request) -> Result<Vec<Line>, String> {
    if lines.len() > 20000 {
        return Err("识别区域过多。".into());
    }
    let mut result = Vec::new();
    for mut line in lines {
        if ![line.x0, line.x1, line.y0, line.y1]
            .iter()
            .all(|v| v.is_finite())
        {
            return Err("系统返回了无效的文字位置。".into());
        }
        line.text = line.text.trim().to_string();
        line.x0 = line.x0.clamp(0.0, request.width as f64);
        line.x1 = line.x1.clamp(0.0, request.width as f64);
        line.y0 = line.y0.clamp(0.0, request.height as f64);
        line.y1 = line.y1.clamp(0.0, request.height as f64);
        line.confidence = line
            .confidence
            .filter(|n| n.is_finite())
            .map(|n| n.clamp(0.0, 100.0));
        if !line.text.is_empty() && line.x1 > line.x0 && line.y1 > line.y0 {
            result.push(line);
        }
    }
    Ok(result)
}

#[tauri::command]
pub async fn system_ocr_status() -> Result<Status, String> {
    tauri::async_runtime::spawn_blocking(platform::status)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn system_ocr_recognize(
    request: tauri::ipc::Request<'_>,
    state: tauri::State<'_, Jobs>,
) -> Result<Vec<Line>, String> {
    let (pixels, metadata): (Vec<u8>, Request) = match request.body() {
        tauri::ipc::InvokeBody::Raw(packet) => crate::binary::unpack(packet)?,
        _ => return Err("需要二进制图像请求。".into()),
    };
    validate(&metadata, &pixels)?;
    let jobs = state.0.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = jobs.try_lock().map_err(|_| "系统识别仍在结束中，请稍后重试。")?;
        checked_lines(platform::recognize(&metadata, &pixels)?, &metadata)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
mod platform {
    use super::*;
    pub fn status() -> Result<Status, String> {
        Err("当前系统没有可用的系统 OCR 接口。".into())
    }
    pub fn recognize(_: &Request, _: &[u8]) -> Result<Vec<Line>, String> {
        Err("系统 OCR 不可用。".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_malformed_images_and_languages() {
        let mut req = Request {
            width: 1,
            height: 1,
            language: "eng".into(),
        };
        assert!(validate(&req, &[255; 4]).is_ok());
        assert!(validate(&req, &[255; 3]).is_err());
        req.width = u32::MAX;
        assert!(validate(&req, &[]).is_err());
        req.width = 1;
        req.language = "unknown".into();
        assert!(validate(&req, &[255; 4]).is_err());
    }

    #[test]
    fn normalizes_boxes_without_inventing_confidence() {
        let req = Request {
            width: 100,
            height: 100,
            language: "eng".into(),
        };
        let lines = checked_lines(
            vec![Line {
                text: " Hello ".into(),
                confidence: None,
                x0: -0.2,
                y0: 2.0,
                x1: 101.0,
                y1: 40.0,
            }],
            &req,
        )
        .unwrap();
        assert_eq!(lines[0].text, "Hello");
        assert_eq!(lines[0].confidence, None);
        assert_eq!(lines[0].x0, 0.0);
        assert_eq!(lines[0].x1, 100.0);
    }
}

