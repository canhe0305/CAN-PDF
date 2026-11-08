# CAN PDF

<p align="center">
  <strong>祂的工具箱系列- 能 ！ PDF - MACOS/WINDOWS</strong>
</p>

<p align="center">
  <img src="frontend/public/cans-icon.svg" width="96" height="96" alt="CAN PDF Logo" />
</p>

<p align="center">
  <a href="https://github.com/tauri-apps/tauri"><img src="https://img.shields.io/badge/Desktop-Tauri%20v2-blue?logo=tauri" alt="Tauri v2"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React%2019-61dafb?logo=react" alt="React 19"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-2021-orange?logo=rust" alt="Rust"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
</p>

---

##  核心特色 (Key Features)

* 以文件为中心的UI设计 
  采用现代沉浸式极简无边框窗口。支持标题栏任意区域平滑拖拽移动、双击最大化/还原，窗口控制按钮融入应用原生设计，关闭时提供贴心的未保存工作拦截保护。

* 100% 本地离线与数据主权 (100% Local & Privacy-First)  
  无任何后端依赖，不上传任何文档至第三方云端。所有文本编辑、页面拼装、密码解密均在电脑本地内存完成，保障敏感文档绝对安全。

* 极致轻量与原生性能 (Lightweight & Native Performance)  
  基于 **Tauri 2 (Rust)** 打造，调用系统原生现代化内核（Windows WebView2 / macOS WebKit）。体积仅数十兆，内存占用极低，告别 Electron 与 Java JRE 的资源臃肿。

* 深度行级原位编辑 (Line-Level In-Place Editing)
  针对学术论文、公文等高密度排版，默认采用行级绝对坐标原位微调（Line-Mode）与自适应右向延展，彻底解决段落自动重排导致的错位、挤字、行尾截断与字形跳动。

* 跨平台开箱即用 (Cross-Platform Ready)  
  内置 GitHub Actions 全自动多平台编译流水线，支持一键为 **Windows** 和 **macOS (Apple Silicon M1~M4 / Intel)** 构建原生安装包。

---

## 🚀 快速下载与安装 (Downloads)

您可以在本仓库右侧的 [**Releases**](../../releases) 页面直接下载对应系统的安装包：

| 操作系统 / 芯片架构 | 推荐下载格式 | 说明 |
| :--- | :--- | :--- |
| **Windows (x64)** | `CAN PDF.exe` 或 `...setup.exe` | 下载即可双击打开，免安装绿色轻量 |
| **macOS (Apple Silicon)** | `CAN_PDF_..._aarch64.dmg` | 适用于 M1 / M2 / M3 / M4 芯片 Mac，拖入“应用程序”即可 |
| **macOS (Intel)** | `CAN_PDF_..._x64.dmg` | 适用于 Intel 处理器 Mac，拖入“应用程序”即可 |

---

## 🛠️ 本地源码构建与开发 (Local Development)

### 1. 环境准备
* **Node.js** >= 20
* **Rust** >= 1.80 (包含 `cargo`)

### 2. 构建命令
```bash
# 进入前端目录并安装依赖
cd frontend
npm ci --ignore-scripts

# 编译 CAN PDF 前端资源
npm run build:cans

# 启动桌面端调试
npm run tauri -- dev

# 打包生产桌面可执行文件
npm run tauri -- build
```

---

## 💡 致谢与开源生态 (Acknowledgements)

CAN PDF 的诞生离不开开源社区多个优秀工程的奠基与启发。我们秉持开放、合规与尊重的开源精神，特此向以下核心项目及贡献者致以崇高的敬意：

* **[Stirling-PDF (Core)](https://github.com/Stirling-Tools/Stirling-PDF)** (MIT License)  
  提供了极为出色的 PDF 工具流与交互架构基石。本项目基于其开源核心层（Core），剥离服务端运行负担，深度重构为纯本地沉浸式无边框工作区。
* **[Tauri](https://github.com/tauri-apps/tauri)** (Apache-2.0 / MIT License)  
  赋予了本项目安全、轻量的跨平台桌面底层。通过轻量 Rust IPC 与系统原生 Web 运行时绑定，实现了无感启动与微秒级响应。
* **[Google PDFium](https://pdfium.googlesource.com/pdfium/)** (Apache-2.0 License)  
  驱动了底层的 C++ / WebAssembly 高性能 PDF 渲染与二进制解析引擎。
* **[pdf-lib](https://github.com/Hopding/pdf-lib)** (MIT License)  
  提供了纯客户端高效安全的 PDF 页面重排、合并与底层对象流操作支持。
* **[Mozilla PDF.js](https://github.com/mozilla/pdf.js)** (Apache-2.0 License)  
  提供了高保真文档阅读视口与前端文字排版图层。
* **[Lucide Icons](https://github.com/lucide-icons/lucide)** (ISC License)  
  为现代化的无边框桌面界面提供了清晰、一致的高质量设计语言。

---

## 📄 开源许可证 (License)

本项目基于 **[MIT License](LICENSE)** 授权开源。您可以自由地使用、修改和分发，使用时请保留原始版权与开源许可声明。
