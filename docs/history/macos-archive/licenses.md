# 依赖与许可证

前端直接依赖的安装版本及 package.json 许可证见 `dependency-licenses.json`，精确依赖树见项目 `package-lock.json`。此清单不是发行版完整许可证审计。

- PDF.js：Apache-2.0。本项目 `src/components/text-layer.css` 改编自该包文字层样式，保留版权与许可证声明。
- pdf-lib、@pdf-lib/fontkit：MIT。
- @embedpdf/pdfium 2.15.1：包装层 MIT，PDFium 及其第三方组件许可证随运行时保留在 `public/original-text/LICENSE.txt` 与 `LICENSE.pdfium.txt`。本机 WASM 按需加载，用于编辑原文字对象。
- Tesseract.js 7：Apache-2.0，许可文件随本机 OCR 运行时保存在 `public/ocr/`。
- React / React DOM：MIT。
- Stirling-PDF：适配 MIT 范围内的 `embeddedFace.ts` 字体提取与注册逻辑，固定提交 `65fbfd10cad4d47511bbfe98cee5e4a750aa33ac`。完整许可与修改说明随应用保存在 `public/licenses/stirling/`；未包含该仓库许可例外目录中的代码。
- Tauri：MIT OR Apache-2.0。
- PdfCraft：MIT OR Apache-2.0，固定提交 `d3db99818f533a531dbcd469b2ac71ba35c0d3ec`。本轮引入标准批注、页面管理、图片优化、批注交换及底层模块；完整声明保存在 `src-tauri/vendor/pdfcraft`，并通过 `public/licenses/pdfcraft` 随应用分发。未采用上游品牌素材。字体模块编译时包含 Dancing Script，OFL 1.1 原文一同保留；未包含可选日文字库。
- Lucide：ISC；以安装包许可证为准，发行前保留图标相关声明。
- Noto Sans CJK SC：SIL Open Font License 1.1，完整许可证在 `public/fonts/LICENSE.txt`。字体源为 notofonts/noto-cjk 的 Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf，通过官方仓库下载；当前 SHA-256 已记录在 `font-sha256.json`，发行前还应固定上游修订。

Rust 的实际解析版本见 `src-tauri/Cargo.lock`。PdfCraft 接入增加 image、skrifa、roxmltree 及相关底层依赖；完整发行版传递依赖许可证审计仍待完成。

发布前须保存依赖的许可原文、确认字体分发和子集嵌入要求，并运行完整传递依赖审计。项目自身许可证由项目所有者决定，当前未擅自指定开源授权。
