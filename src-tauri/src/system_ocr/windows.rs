use super::{Line, Request, Status};
use windows::{
    Globalization::Language,
    Graphics::Imaging::{BitmapPixelFormat, SoftwareBitmap},
    Media::Ocr::OcrEngine,
    Storage::Streams::DataWriter,
    Win32::System::WinRT::{RoInitialize, RoUninitialize, RO_INIT_MULTITHREADED},
};

struct Apartment;
impl Apartment {
    fn new() -> windows::core::Result<Self> {
        unsafe {
            RoInitialize(RO_INIT_MULTITHREADED)?;
        }
        Ok(Self)
    }
}
impl Drop for Apartment {
    fn drop(&mut self) {
        unsafe {
            RoUninitialize();
        }
    }
}

fn error(e: windows::core::Error) -> String {
    format!("Windows OCR 不可用：{e}")
}

fn languages() -> windows::core::Result<Vec<(String, Language)>> {
    let mut result = Vec::new();
    for language in OcrEngine::AvailableRecognizerLanguages()? {
        let tag = language.LanguageTag()?.to_string().to_lowercase();
        let code = if tag.starts_with("en-") || tag == "en" {
            "eng"
        } else if tag.starts_with("zh-hans") || tag == "zh-cn" {
            "chi_sim"
        } else {
            continue;
        };
        if OcrEngine::TryCreateFromLanguage(&language).is_ok() {
            result.push((code.into(), language));
        }
    }
    Ok(result)
}

pub fn status() -> Result<Status, String> {
    let _apartment = Apartment::new().map_err(error)?;
    let mut codes: Vec<String> = languages()
        .map_err(error)?
        .into_iter()
        .map(|(code, _)| code)
        .collect();
    codes.sort();
    codes.dedup();
    Ok(Status {
        engine: "Windows OCR".into(),
        languages: codes,
        max_dimension: OcrEngine::MaxImageDimension().map_err(error)?.min(8192),
    })
}

pub fn recognize(request: &Request, pixels: &[u8]) -> Result<Vec<Line>, String> {
    let _apartment = Apartment::new().map_err(error)?;
    (|| -> windows::core::Result<Vec<Line>> {
        let available = languages()?;
        let code = if request.language == "eng" {
            "eng"
        } else {
            "chi_sim"
        };
        let language = available
            .into_iter()
            .find(|(c, _)| c == code)
            .map(|(_, l)| l)
            .ok_or_else(|| {
                windows::core::Error::new(
                    windows::core::HRESULT(0x80004005u32 as i32),
                    "所需系统识别语言未安装",
                )
            })?;
        let engine = OcrEngine::TryCreateFromLanguage(&language)?;
        let writer = DataWriter::new()?;
        let mut bgra = pixels.to_vec();
        for pixel in bgra.chunks_exact_mut(4) {
            pixel.swap(0, 2);
            pixel[3] = 255;
        }
        writer.WriteBytes(&bgra)?;
        let bitmap = SoftwareBitmap::CreateCopyFromBuffer(
            &writer.DetachBuffer()?,
            BitmapPixelFormat::Bgra8,
            request.width as i32,
            request.height as i32,
        )?;
        let recognized = engine.RecognizeAsync(&bitmap)?.join();
        let _ = bitmap.Close();
        let _ = writer.Close();
        let result = recognized?;
        let mut output = Vec::new();
        for line in result.Lines()? {
            let mut x0 = f64::INFINITY;
            let mut y0 = f64::INFINITY;
            let mut x1: f64 = 0.0;
            let mut y1: f64 = 0.0;
            for word in line.Words()? {
                let b = word.BoundingRect()?;
                x0 = x0.min(b.X as f64);
                y0 = y0.min(b.Y as f64);
                x1 = x1.max((b.X + b.Width) as f64);
                y1 = y1.max((b.Y + b.Height) as f64);
            }
            if x0.is_finite() {
                output.push(Line {
                    text: line.Text()?.to_string(),
                    confidence: None,
                    x0,
                    y0,
                    x1,
                    y1,
                });
            }
        }
        Ok(output)
    })()
    .map_err(error)
}
