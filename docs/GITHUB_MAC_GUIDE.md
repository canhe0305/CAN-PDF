# CAN PDF 跨平台发布与 GitHub / macOS 部署安装指南

本文档指导如何将本地唯一的 CAN PDF 仓库推送到您个人的 GitHub 仓库，并利用 GitHub Actions 自动云端编译出 **Windows (.exe)** 与 **macOS (.dmg / .app)** 桌面安装包。

---

## 目录
1. [三文件夹归一概览](#1-三文件夹归一概览)
2. [第一步：在 GitHub 上创建自己的新仓库](#2-第一步在-github-上创建自己的新仓库)
3. [第二步：本地关联并推送到 GitHub (仅需 3 条命令)](#3-第二步本地关联并推送到-github-仅需-3-条命令)
4. [第三步：GitHub Actions 自动云端编译与下载安装](#4-第三步github-actions-自动云端编译与下载安装)
5. [第四步：在 Mac 电脑上的安装与本地运行](#5-第四步在-mac-电脑上的安装与本地运行)

---

## 1. 三文件夹归一概览

您电脑此前存在的三个文件夹已全部梳理并整合成唯一的核心文件夹：
* **核心保留**：`E:\AI CODING\CANS Stirling prototype`（唯一全功能源码、全量测试通过、支持 Windows/macOS 双端）
* **历史文档合并**：`CANS PDF macOS` 中的所有白皮书、架构设计、技术决策文档均已迁移至 `docs/history/macos-archive/`。
* **交接元数据合并**：`CANS handoff 2026-11-08` 的移交快照信息已迁移至 `docs/history/handoff-2026-11-08/`。

另外两个旧文件夹已不再需要，可安全移走或删除。

---

## 2. 第一步：在 GitHub 上创建自己的新仓库

1. 打开浏览器登录您的 GitHub：[https://github.com/new](https://github.com/new)
2. **Repository name**（仓库名称）：输入 `cans-pdf`（或您喜欢的名字，如 `CAN PDF`）
3. **Visibility**（可见性）：根据喜好选择 **Public**（公开）或 **Private**（私有）
4. **注意**：不要勾选 *Add a README file*、*Add .gitignore*，保持为一个全新的**空白仓库**。
5. 点击绿色按钮 **Create repository**。
6. 复制页面上显示的仓库链接，格式类似：`https://github.com/<您的用户名>/cans-pdf.git`

---

## 3. 第二步：本地关联并推送到 GitHub (仅需 3 条命令)

在当前工作区终端（PowerShell 或 Git Bash）依次执行以下命令：

```powershell
# 1. 将所有新功能、无边框桌面端与 macOS 配置全部添加到暂存区
git add .

# 2. 提交更新
git commit -m "feat: complete CAN PDF frameless desktop with Windows & macOS CI release support"

# 3. 将远程推送地址改为您刚才创建的个人 GitHub 仓库 (请将下面的 URL 替换为您的真实地址)
git remote set-url origin https://github.com/<您的用户名>/cans-pdf.git

# 4. 推送到您的 GitHub main 分支
git branch -M main
git push -u origin main --force
```

---

## 4. 第三步：GitHub Actions 自动云端编译与下载安装

代码推送到 GitHub 后，您无需在 Windows 上配置复杂的 macOS 交叉编译环境，仓库已内置了自动化发布流水线：`.github/workflows/release.yml`。

### 触发打包发布：
有两种极为方便的触发方式：

#### 方式 A：打版本标签自动触发（推荐）
在本地终端执行：
```powershell
git tag v0.1.0
git push origin v0.1.0
```

#### 方式 B：在 GitHub 网页上一键手动点击运行
1. 打开您 GitHub 仓库的页面，点击顶部的 **Actions** 标签栏；
2. 在左侧列表中点击 **Release CAN PDF Desktop (Windows & macOS)**；
3. 点击右侧的 **Run workflow** 下拉按钮，再点击绿色的 **Run workflow** 按钮。

### 云端自动编译机制：
GitHub 会自动分配两台强大的云端独立服务器并行构建：
* 🍎 **macOS 最新虚拟机**：自动安装 Node.js、Rust，构建出 **Apple Silicon (M1/M2/M3/M4)** 与 **Intel Mac** 的原生 `.dmg` 安装包与 `.app`。
* 🪟 **Windows 虚拟机**：自动编译出最新的 Windows 64位无边框 `.exe` 及安装程序。

构建完成后（约 3~5 分钟），GitHub 会自动在您仓库右侧的 **Releases** 页面发布新版本，并提供所有安装包的直接下载链接！

---

## 5. 第四步：在 Mac 电脑上的安装与本地运行

### 方式 1：直接下载安装（最省心）
1. 在您的 Mac 电脑上，用 Safari/Chrome 浏览器打开您的 GitHub 仓库 Releases 页面：
   `https://github.com/<您的用户名>/cans-pdf/releases`
2. 点击下载：
   * 如果您的 Mac 是 M1 / M2 / M3 / M4 芯片：下载文件名带有 `aarch64.dmg` 的安装包；
   * 如果您的 Mac 是 Intel 处理器：下载文件名带有 `x86_64.dmg` 的安装包。
3. 双击下载的 `.dmg`，将 **CAN PDF** 图标拖入 **Applications（应用程序）** 文件夹。
4. 在“启动台”中点击 CAN PDF 即可启动！享受纯净离线的 PDF 编辑与无边框体验。
   *(注：首次打开若 macOS 提示“无法验证开发者”，在 Mac 的【系统设置】→【隐私与安全性】中点击【仍要打开】即可)*

### 方式 2：在 Mac 上本地源码开发与调试
如果您希望在 Mac 上直接写代码或本地调试：
1. 确保 Mac 安装了基础环境：
   ```bash
   xcode-select --install
   # 安装 Node 20+ 与 Rust:
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. 克隆您的 GitHub 仓库并启动调试：
   ```bash
   git clone https://github.com/<您的用户名>/cans-pdf.git
   cd cans-pdf
   cd frontend && npm ci && cd ..
   npx @go-task/cli desktop:dev
   # 或者直接运行:
   cargo run --manifest-path src-tauri/Cargo.toml
   ```
