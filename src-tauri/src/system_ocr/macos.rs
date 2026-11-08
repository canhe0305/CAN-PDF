use super::{Line, Request, Status};

pub fn status() -> Result<Status, String> {
    Ok(Status {
        engine: "Apple Vision".into(),
        languages: vec!["eng".into(), "chi_sim".into()],
        max_dimension: 8192,
    })
}

pub fn recognize(_request: &Request, _pixels: &[u8]) -> Result<Vec<Line>, String> {
    Err("macOS OCR 接口将在 Mac 构建中启用。".into())
}
