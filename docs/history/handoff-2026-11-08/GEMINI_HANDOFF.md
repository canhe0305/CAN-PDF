# CANS / Stirling-PDF：Gemini 接手任务书

保存日期：2026-11-08。本文记录当前源码状态，不代表第一阶段已经验收完成。

## 1. 从哪里继续

**主要工作目录：`E:\AI CODING\CANS Stirling prototype`。**

用户最新确定的方向：以 Stirling-PDF 可复用的核心作为基础，把界面、交互和桌面体验改成 CANS。继续这个独立原型，不要默认回到旧 CANS 逐项搬工具，也不要同时维护两套编辑器、文件状态和撤销栈。

其他目录：

| 路径 | 用途 |
| --- | --- |
| `E:\AI CODING\whoes pdf` | 旧 CANS Windows 工程，保留作为交互与原生能力参考 |
| `E:\AI CODING\CANS PDF macOS` | 旧 CANS 的 macOS 源码副本，不是新 Stirling 原型的 Mac 版 |
| `E:\AI CODING\CANS handoff 2026-11-08` | 源码快照、校验清单、检查日志与启动提示 |

先读本文件、根 `AGENTS.md`、`CANS_PLAN.md`，以及旧工程 `docs/stirling-foundation-direction-2026-11-07.md`。大范围分析按用户约定使用 `gemini -p` 的 `@` 文件/目录语法。上一轮 Gemini CLI 停在交互认证，没有产出代码分析结论。

## 2. 用户已经确定的产品要求

- 名字是 **CANS**，首页简单，居中打开文件/拖入文件。浅灰背景、深绿强调，避免大块页首、页尾、蓝色系统标题栏和工具软件式面板堆叠。
- PDF 是主体。工具按需要出现；上滚时 PDF 的阅读区域应裁切在工具区下面，不能和工具互相遮挡。最终桌面窗口保留拖动、最小化、最大化、关闭能力。
- 原文编辑是重点：点击“编辑”，页面原文字上出现编辑框，修改自动应用到编辑状态，无需额外点击“完成”。进入/退出不能明显跳字，也不能生成另一套覆盖文字冒充修改原文。
- 字体、字号、原字体保留、中文输入法、中文字体与重排需要真实验证。新增文字框和签名应可选中、移动且流畅；希望能使用电脑本地字体。
- 统一撤销/重做与保存；不能在不同工具之间反复打开同一个文件。Ctrl + 滚轮缩放很重要。
- 最终支持 Windows / macOS，本机处理优先。OCR 是可选能力，用户希望优先调用系统本地 OCR，但它不等同于已有文字 PDF 的原文编辑。
- 后续保留 AI 翻译、尽量保持排版，用户自行配置 API URL、模型和 API key。此原型尚未迁移该功能。

这些是长期目标。第一阶段先把打开 → 原文编辑 → 撤销/重做 → 保存 → 重开闭环做可靠，不能把长期目标都标成已完成。

## 3. 上游版本与复用边界

- 仓库：`https://github.com/Stirling-Tools/Stirling-PDF`
- 固定提交：`046f1a0e7163fae43ad9b687fdd1c697f05dda8d`。
- 当前是 **partial / sparse checkout**。已经落地的是前端核心、相应配置/脚本、开发文档、语言资源和部分字体/测试素材，并非完整上游仓库。
- 网络下载曾反复 EOF；部分 Git 对象未在本地，`git status` / `git diff` 也可能触发 lazy fetch 并失败。不要据此 reset、清理或覆盖现有修改。交接 ZIP 是独立的源码快照，不依赖 Git 对象完整性；它不包含 `.git` 历史。
- 根 LICENSE 是带明确目录排除的 MIT。`app/proprietary`、`app/saas`、`engine`、`frontend/src/editor/{proprietary,desktop,saas,cloud}`、`frontend/src/processor` 另有授权。不要直接改名分发官方桌面层。当前从 core 模式接入；继续核对实际构建别名、间接导入和依赖许可。
- 目前没有启动 Java 后端，没有新 Windows 安装包、exe 或 macOS 安装包。浏览器原型可运行不代表完整 Stirling 功能均可离线使用。

## 4. 当前实现及关键文件

下列路径相对于主要工作目录。

| 文件 / 目录 | 当前用途 |
| --- | --- |
| `CANS_PLAN.md` | 已选视觉方向和第一阶段范围 |
| `frontend/src/editor/core/App.tsx` | 指向 CansApp 的核心入口 |
| `frontend/src/editor/core/components/cans/CansApp.tsx` | 复用 PlatformProviders / AppProviders 等，注入本地配置及中文文案，停用账号/分析等入口 |
| 同目录 `CansWorkspace.tsx` | CANS 首页、顶栏、阅读/编辑切换、文件操作和可选属性面板；沿用 FileContext / EditorSession / NavigationGuard |
| 同目录 `CansWorkspace.test.tsx` | 6 项打开、保存和关闭目标/保护逻辑测试 |
| 同目录 `copy.json`、`workspace.css` | CANS 自有中英文案和工作区样式；中文以运行时资源包注入，没有改上游 zh-CN 文件 |
| `frontend/src/editor/core/theme/primitives.css` | CANS 色板变量 |
| `frontend/src/editor/core/hooks/useLogoAssets.ts`、`frontend/public/cans-icon.svg` | CANS 图标入口 |
| `frontend/index.html`、`frontend/src/index.tsx` | 简化壳层、移除客户端重复 ColorSchemeScript |
| `frontend/vite.cans.config.ts` | 在上游配置上强制 core；输出 dist-cans；移除 OG 预渲染与会剪除本地字体的静态复制插件 |
| `.taskfiles/frontend.yml` | 默认核心类型检查、core 测试、CANS core 构建入口；不依赖营销 OG 生成 |
| `frontend/public/locales/en-US/translation.toml` | 追加 `[cans]` 英文键 |
| `frontend/src/assets/3rdPartyLicenses.json` | 上游脚本重新生成的直接依赖报告，不等同完整许可审计 |
| `frontend/public/licenses/fonts/` | 已加入字体许可证 |

原文编辑相关修改均在 `frontend/src/editor/core/tools/pdfTextEditor/`：

- `store/EditorSession.ts` / `PdfTextEditor.tsx`：新增 `pickDiskFile` 会话入口，让磁盘文件经过原有解锁、未保存保护与 FileContext 登记；不要把裸磁盘 File 误用为已有工作区文件。
- `CansWorkspace.tsx`：编辑状态标题/关闭操作优先使用编辑器 fileId / fileName；避免误关阅读器的另一个文件。保存由当前编辑会话负责。
- `util/fallbackFont.ts`：回退字体改为 **NotoSansSC-Regular.ttf**；验证实际 TrueType 头和长度，HTML 错误页面不得被当字体缓存；失败允许重试。
- `hooks/useDocumentLoader.ts`：文档启用编辑前等待回退字体预加载，等待后复核当前加载 token。字体加载失败仍要保留原有丢字风险提示，不能静默接受损坏输出。
- `__tests__/fallbackFont.test.ts`：2 项，实际字体 cmap 覆盖中文和 HTML 响应拒收/重试。

已落地字体位于 `app/core/src/main/resources/static/fonts/`：NotoSansSC、NotoSans、LiberationSans 四种、LiberationSerif-Regular、LiberationMono-Regular。其他字形/语种资源未做完整审计，不能保证任意 PDF 不缺字体。

字体资源核对：

| 文件 | 字节数 | 上游 Git blob SHA-1 |
| --- | ---: | --- |
| NotoSansSC-Regular.ttf | 12,925,572 | `23164652bdc280e5925e746f327a90a6b6c2fed5` |
| NotoSans-Regular.ttf | 582,748 | `fa4cff505eb671d6258554f5d71e873f686a6098` |

曾使用临时 Latin 字体后恢复为真正上游文件。**现有 dist-cans 的 Latin 字体仍可能是旧的 629,024 字节版本；请从当前源码重新构建后再做验收。** 中文字体源码与现有构建资源均是 12,925,572 字节。

## 5. 已做的验证与未完成项

### 静态检查 / 测试 / 构建

- 核心 TypeScript 检查通过。
- 最近一次 frontend:check 的 lint、格式、主题/图标等前置检查通过，但 **总检查失败**。
- 最后全量测试：**416 个文件，414 通过、2 失败；4,662 项测试，4,660 通过、2 失败**。
- 失败 1：`src/editor/core/data/ogMetadata.test.ts` → `prerender refuses a drifted HTML shell` → `prerenders the shipped editor/index.html, not just the test fixture`。CANS 简化的 HTML 不再含 OG 预渲染脚本期待的 description meta。需要决定 CANS 与上游营销壳层的测试/契约边界。
- 失败 2：`src/editor/core/tests/unusedTranslations.test.ts`，检测到 **3,377** 个无引用的 en-US 键。稀疏 core 源码不含其他授权层的消费者，且 CANS 已替换原 App 入口，但共享英文词表仍完整。具体范围需分析；**不要直接删掉几千条翻译，也不要添加宽泛忽略来伪装通过**。
- 6 个相关测试文件的定向检查共 249 项通过，覆盖 CANS、字体及补齐语言/共享测试素材后的相关逻辑。全量检查结果以上述 2 项失败为准。
- `frontend:build:core` 成功（最后日志 13.80 秒）。字体源文件后续有恢复，需重新构建同步。构建成功不代表中文往返验证通过。
- 完整原始日志保存在交接目录 `logs/`。

### 英文实际往返：通过

使用合成的 `frontend/tests/cans-fixtures/plain.pdf`（2,295 字节、3 页），在原文编辑器将 Application form 改为 `CANS workspace 2026`。撤销/重做能改变/恢复内容；连续输入的撤销分组仍应进一步评估，不能宣称一次撤销总能恢复整段。

导出的 PDF 为 5,966 字节，解析结果包含新文字且原 Application form 被替换。关闭、刷新浏览器清空编辑器后，重新打开保存的 PDF，再进入原文编辑器，看到已修改的内容且 dirty 为 false。此验证是在核心 PDF 内容上修改，不是只改界面覆盖层。

### 中文实际往返：修复后尚未验收

合成文件 `frontend/tests/cans-fixtures/chinese.pdf`（13,834,897 字节），原文 `原文已修改` 改为 `原文编辑验证`。修复前原 Latin 回退字体不能编码中文，保存明确提示 `文 编 辑 验 证` 等字符会丢失；当时没有确认“仍然保存”。

随后加入真实 NotoSansSC TrueType 文件、预加载和格式校验；字体 cmap 单元测试通过，但 **修复后的中文编辑 → 导出 → 重开 → 再编辑尚未跑完**。用户要求保存交接时停在生产预览已打开中文文件、进入编辑的状态。不要把预加载成功或单元测试代替 PDF 往返验收。

HMR 期间出现过页面仍有文档、编辑会话标题却“未加载文件”的单例/Provider 状态差异。请优先全新生产预览上下文复测，再判断是否存在实际会话生命周期缺陷。浏览器里的临时 Blob 捕获/测试全局变量只用于验收，不属于源码实现。

### 明确还没完成

中文输入法/复杂 CJK 字形、原字体保留与重排；中文输出体积（整字体约 13 MB、尚无子集优化）；本地字体选择；长文档性能；所有打开/取消/保存失败/关闭竞态；新桌面壳层；Windows/macOS 原生文件保存；系统 OCR；AI 翻译迁移；完整本机服务能力表与服务生命周期。

## 6. 接手后按此顺序工作

1. **先复核当前边界与两个失败测试。** 阅读现有 CANS 适配层和上游对应 API，列清失败来源。保留有意义的测试契约，针对产品边界修复配置/壳层/测试，不靠跳过测试交付。
2. **从当前源码重新构建，优先完成中文往返验收。** 新开隔离浏览器上下文，加载合成 PDF，验证中文输入/IME/混排、撤销/重做、自动应用、导出重开再编辑。不能接受丢字、双层字、原文未删除、进入编辑跳字。用 PDF 解析和渲染检查相邻文字/图片是否保留；确实无法保留的格式要准确报告。
3. **完成文档状态闭环。** 验证阅读→编辑、编辑时打开另一个磁盘文件、取消未保存提示、取消文件框、保存失败、关闭当前文档、重开输出。标题/fileId/FileContext/dirty 与实际内容必须一致；仅一套撤销栈和保存入口。
4. **再清理 UI 与性能。** 保留已认可首页与色板，减掉重复工具/白色大面板；不遮挡 PDF；验证 Ctrl+滚轮与拖动交互。先用可复现长文档和性能记录找瓶颈，再改缓存/渲染/状态更新，避免无依据重写核心。
5. **输出功能/依赖能力表，再做桌面适配。** 分清纯前端、需要本机服务、可选外部组件、需另行授权。选择可分发的 Windows/macOS 薄壳及平台服务接口；无需为了换 UI 复制官方受限桌面实现。
6. **最后扩展 OCR、转换、翻译等。** 旧工程仅作为已有能力参考；不要把两个完整 App 嵌套起来。每项功能都给出依赖、失败处理和本机验收结果。

阶段交付标准：当前改动的检查可解释且通过；中英文原文编辑往返有可复现记录；文档状态与未保存保护可靠；依赖能力表清楚。未完成的原生平台工作必须单独标明。

## 7. 本机命令

PowerShell。从主要工作目录开始。不要直接使用上游默认桌面构建模式。

```powershell
Set-Location -LiteralPath 'E:\AI CODING\CANS Stirling prototype'

# 如果依赖还在，不必重新安装。恢复源码 ZIP 后才需要：
Push-Location frontend
$env:PUPPETEER_SKIP_DOWNLOAD = 'true'
npm ci --no-audit --no-fund
Pop-Location

# 控制测试并行，避免原来默认并发导致超时
$env:STIRLING_CHECK_JOBS = '4'
npx --yes @go-task/cli frontend:check
npx --yes @go-task/cli frontend:build:core

# 开发 / 生产预览，按需要二选一，先检查端口是否被占用
Push-Location frontend
npx vite --config vite.cans.config.ts --mode core --host 127.0.0.1 --port 1421
# 或：npx vite preview --config vite.cans.config.ts --mode core --host 127.0.0.1 --port 1422
Pop-Location
```

环境记录：Node v24.12.0、npm 11.6.2；部分上游依赖提示需 Node 24.15+ 或 26，下一次安装应核对实际 engines。task 未全局安装，通过 `npx --yes @go-task/cli` 运行，最近缓存版本为 3.54.0。

最近预览端口：旧 CANS `1420`；新原型开发 `1421`；新原型生产 `1422`。进程可能已退出或 PID 已改变，以当前端口检测为准。不要停止无关服务。已有浏览器可能打开用户真实文档；验收只用合成素材和隔离上下文。

## 8. 旧工程与系统 OCR 的保留状态

旧 Windows 工程的上一交付文件仍在：

`E:\AI CODING\whoes pdf\src-tauri\target\release\CANS-editing-recovery-2026-11-07.exe`

当时记录 47,844,864 字节，SHA-256 `7a49075fcd66c2c45fc3c09573724d0437c0d7cb5cdd0bd313c4c1b1de6d40c4`。该旧交付曾通过 102 项前端和 22 项 Rust 测试；这些数量不属于新 Stirling 原型验证。旧工程详情见 `docs/editing-recovery-2026-11-07.md` / `.json`。

系统 OCR 中途修改位于旧工程 `src-tauri/src/system_ocr/{mod.rs,windows.rs,macos.rs,macos.m}` 及 Cargo/build/lib 接线。Windows 桥接编译、2 项边界测试通过，真实 WinRT OCR 未运行；macOS 桥接未编译；前端自动选择/回退未接；未同步 Mac 副本、未生成新发行程序。不要标为完成。

修改前备份仍在 `C:\Users\Canhe\AppData\Local\Temp\cans-system-ocr-e23c5dc2`，另一旧备份 `cans-editing-upgrade-nDwpkd`。当前交接源码包已经保存三个工程的现有源码，排除编译输出和依赖缓存；Temp 不是长期交付依赖。

## 9. 快照说明

`E:\AI CODING\CANS handoff 2026-11-08\CANS-source-2026-11-08.zip` 包含当前新原型、旧 Windows 源码、旧 macOS 源码、任务书、检查日志以及合成验收素材。哈希清单用于核对快照内容。

排除 `.git`、node_modules、target、dist / dist-cans、测试输出、OCR 下载模型、构建缓存、机器本地 `.env*.local` 和签名密钥等。ZIP 是**当前已落地源码**快照，不宣称完整上游克隆，不含已有 exe，也不包含未落地的后端/受限模块。原有工作目录均保留。

此前 Temp 中 `cans-stirling-046f1a0e.zip` 是网络中断的残缺上游下载，没有完整 ZIP 目录，**不是备份，不要使用它恢复项目**。
