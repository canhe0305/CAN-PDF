# CANS PDF · macOS 开发副本

这是一份独立的源码副本，2026-11-01 从 Windows 项目复制而来，供搬到 Mac 后继续开发和构建。尚未在 macOS 上编译、运行或验收，也没有生成 Mac 安装包。

## 已准备

- 完整前端与 Tauri / Rust 源码、npm 和 Cargo 锁文件。
- PdfCraft 本地路径依赖、工作区配置、资源及许可证。
- 中文字体、PDF 阅读和 OCR 运行资源、测试样本、脚本与开发文档。
- macOS 图标 `src-tauri/icons/icon.icns`。
- `src-tauri/tauri.conf.json` 的打包目标已从 `nsis` 改为 `app`、`dmg`。保留 CANS PDF 名称及现有无边框界面。

没有复制 `node_modules`、`src-tauri/target`、`dist`、生成的 Tauri schema、测试输出和 OCR 模型缓存。它们需要在 Mac 上重新安装或生成；Windows 的原生依赖和可执行文件不适用于 Mac。原 Windows 项目没有改动。两个文件夹此后独立维护，不自动同步。

## 在 Mac 上运行

1. 把整个 `CANS PDF macOS` 文件夹复制到 Mac，保留隐藏文件。
2. 安装 Node.js 24+（项目要求）、Rust stable（本项目 vendored PdfCraft 声明至少 Rust 1.90）和 Xcode Command Line Tools。仅做桌面开发时可执行：

   ```sh
   xcode-select --install
   ```

   等安装完成。Node.js 可从 [官方站点](https://nodejs.org/) 安装，Rust 可按 [官方安装说明](https://www.rust-lang.org/tools/install) 安装。

3. 在终端进入实际复制位置，例如：

   ```sh
   cd "$HOME/Projects/CANS PDF macOS"
   node --version
   rustc --version
   xcode-select -p
   npm ci
   npm run fixtures
   npm run tauri -- dev
   ```

   `npm ci` 会安装当前 Mac 架构的依赖并执行资源复制脚本。锁文件包含 Apple Silicon 和 Intel 的相关可选依赖，不要从 Windows 复制 `node_modules`，也不要使用 `--omit=optional` 或跳过安装脚本。

如只想预览前端，使用 `npm run dev`。浏览器预览不等于桌面功能验收，本机保存、系统字体等必须通过 Tauri 程序检查。

## 验证和打包

在 Mac 的项目根目录执行：

```sh
npm run fixtures
npm run check
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri -- build
```

默认构建当前 Mac 对应架构的应用：Apple Silicon 和 Intel 应分别验证。这里没有配置 Universal 通用包，也没有承诺最低兼容系统版本。

成功后通常在以下目录找到产物：

- `src-tauri/target/release/bundle/macos/CANS PDF.app`
- `src-tauri/target/release/bundle/dmg/` 下的 `.dmg`

若只需先验证应用，可用 `npm run tauri -- build --bundles app`。正式对外分发前再配置签名、公证并完成安装测试；本副本没有签名证书或凭据。

环境和打包方式依据 Tauri 官方文档：[前置依赖](https://v2.tauri.app/start/prerequisites/)、[macOS 应用包](https://v2.tauri.app/distribute/macos-application-bundle/)、[DMG](https://v2.tauri.app/distribute/dmg/)。

## 接下来必须在 Mac 上完成的适配

1. **本机字体**：`src-tauri/src/fonts.rs` 当前只有 Windows 注册表实现；其他系统返回空列表，不支持读取本机字体。需要接入 macOS 字体枚举与安全读取，验证字体集合、中文覆盖及 PDF 嵌入。内置思源黑体、思源宋体资源已复制；系统字体功能不能算完成。
2. **窗口与快捷键**：保留现有自定义无边框窗口。验证拖动、关闭、最小化、最大化以及关闭前保存保护；决定是否接入 macOS 原生窗口按钮。`src/App.tsx` 的主要快捷键已判断 Ctrl / Meta，但 UI 的 Ctrl 提示、系统菜单、Cmd 操作仍需逐项检查。`src/document/useDocumentView.ts` 的滚轮缩放目前判断 Ctrl，需实测触控板手势。
3. **WebKit 与编辑体验**：在真实桌面窗口测试 PDF.js / PDFium WASM、中文输入法、原文编辑自动应用、拖动文本与签名、缩放和长文档滚动。Windows 或浏览器测试结果不能代替 macOS 验收。
4. **本机文件流程**：测试打开、拖入、另存为、安全替换、草稿恢复和取消操作；验证翻译 API 与按需下载 OCR 模型。OCR 模型首次使用仍需下载。
5. **发行**：实测目标 macOS 版本及芯片架构，再处理文件关联、签名、公证和 DMG 安装 / 卸载体验。

复制来源和逐文件 SHA-256 记录在 `docs/macos-source-snapshot.json`；其中的哈希对应复制前的源文件，打包配置是列出的有意差异。`docs/` 中已有的 Windows 构建记录与测试结论属于历史资料，不代表 macOS 已通过。
