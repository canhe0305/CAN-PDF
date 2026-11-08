import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useFileContext,
  useFileActions,
} from "@editor/contexts/file/fileHooks";
import { useFileHandler } from "@editor/hooks/useFileHandler";
import {
  useNavigationActions,
  useNavigationGuard,
  useNavigationState,
} from "@editor/contexts/NavigationContext";
import { useToolWorkflow } from "@editor/contexts/ToolWorkflowContext";
import { useViewer } from "@editor/contexts/ViewerContext";
import { useEditorSession } from "@editor/tools/pdfTextEditor/store/EditorSession";
import { useWorkbenchBar } from "@editor/contexts/WorkbenchBarContext";
import { downloadFile } from "@editor/services/downloadService";
import { Icon } from "@editor/ui/Icon";
import Workbench from "@editor/components/layout/Workbench";
import RightSidebar from "@editor/components/tools/RightSidebar";
import NavigationWarningModal from "@editor/components/shared/NavigationWarningModal";
import { usePreferences } from "@editor/contexts/PreferencesContext";
import "@editor/components/cans/workspace.css";

type TauriBridge = {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
};

function invokeTauri(cmd: string, args?: Record<string, unknown>) {
  if (typeof window === "undefined") return Promise.resolve();
  const bridge = (window as unknown as { __TAURI_INTERNALS__?: TauriBridge })
    .__TAURI_INTERNALS__;
  if (!bridge || typeof bridge.invoke !== "function") return Promise.resolve();
  return bridge.invoke(cmd, args);
}

/** Workspace chrome delegates edits, history and exports to Stirling. */
export function CansWorkspace() {
  const { t } = useTranslation();
  const { activeFiles } = useFileContext();
  const { actions: fileActions } = useFileActions();
  const { addFiles } = useFileHandler();
  const { actions } = useNavigationActions();
  const { requestNavigation } = useNavigationGuard();
  const { workbench } = useNavigationState();
  const { handleToolSelect, selectedToolKey } = useToolWorkflow();
  const viewer = useViewer();
  const editor = useEditorSession();
  const { viewFileActions } = useWorkbenchBar();
  const { updatePreference } = usePreferences();
  const picker = useRef<HTMLInputElement>(null);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const isDesktop =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const activeId = editor ? editor.fileId : viewer.activeFileId;
  const file =
    activeFiles.find((item) => item.fileId === activeId) ??
    (editor ? undefined : activeFiles[0]);
  const currentName = editor?.fileName ?? file?.name;
  const hasFiles = activeFiles.length > 0;
  useEffect(() => {
    document.documentElement.dataset.cans = "true";
    updatePreference("theme", "light");
    return () => {
      delete document.documentElement.dataset.cans;
    };
  }, [updatePreference]);
  useEffect(() => {
    document.title = currentName ? `${currentName} — CAN PDF` : "CAN PDF";
  }, [currentName]);
  const openFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || opening) return;
      if (files.some((item) => !item.name.toLowerCase().endsWith(".pdf"))) {
        setNotice(t("cans.pdfOnly", "请选择 PDF 文件。"));
        return;
      }
      if (editor?.pickDiskFile && files.length === 1) {
        editor.pickDiskFile(files[0]);
        return;
      }
      requestNavigation(() => {
        setOpening(true);
        setNotice("");
        void addFiles(files)
          .then(() => actions.setWorkbench("viewer"))
          .catch((error) => setNotice(String(error)))
          .finally(() => setOpening(false));
      });
    },
    [actions, addFiles, editor, opening, requestNavigation, t],
  );
  const save = useCallback(async () => {
    if ((!file && !editor) || saving) return;
    setSaving(true);
    setNotice("");
    try {
      if (editor) {
        editor.download();
        return;
      }
      if (!file) return;
      if (workbench === "viewer") {
        const bytes = await viewer.exportActions?.saveAsCopy?.();
        if (!bytes)
          throw new Error(t("cans.notReady", "文档尚未准备好，请稍后重试。"));
        await downloadFile({
          data: new Blob([bytes], { type: "application/pdf" }),
          filename: file.name,
        });
      } else {
        const exports = await viewFileActions?.getExportFiles?.();
        if (!exports)
          throw new Error(t("cans.saveFromViewer", "请切换到阅读视图后保存。"));
        for (const entry of exports)
          await downloadFile({ data: entry.file, filename: entry.file.name });
      }
      setNotice(
        t("cans.downloadStarted", "已生成 PDF 下载，请确认文件已保存。"),
      );
    } catch (error) {
      setNotice(String(error));
    } finally {
      setSaving(false);
    }
  }, [
    editor,
    file,
    saving,
    t,
    viewFileActions,
    viewer.exportActions,
    workbench,
  ]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.keyCode === 229 ||
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        (event.target as HTMLElement)?.closest('[role="dialog"]')
      )
        return;
      const isInput =
        (event.target as HTMLElement)?.isContentEditable ||
        /^(INPUT|TEXTAREA)$/.test((event.target as HTMLElement)?.tagName || "");
      if (event.code === "KeyO" && !isInput) {
        event.preventDefault();
        picker.current?.click();
      }
      if (event.code === "KeyS" && !editor) {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, save]);
  const changeView = (view: "viewer" | "pageEditor") =>
    requestNavigation(() => {
      actions.setSelectedTool(null);
      actions.setWorkbench(view);
    });
  return (
    <div
      className="cans-workspace"
      data-empty={!hasFiles}
      onDropCapture={() => setDragOver(false)}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragOver(false);
      }}
      onDrop={(event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        setDragOver(false);
        void openFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={picker}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          void openFiles(files);
        }}
      />
      <header
        className="cans-titlebar"
        data-tauri-drag-region
        onDoubleClick={(event) => {
          if (
            isDesktop &&
            (event.target === event.currentTarget ||
              (event.target as HTMLElement)?.classList?.contains(
                "cans-titlebar",
              ))
          ) {
            void invokeTauri("app_toggle_maximize");
          }
        }}
      >
        <span className="cans-wordmark">CAN PDF</span>
        {hasFiles && (
          <>
            <span className="cans-file">
              <Icon name="file-text" size={17} />
              <span>{editor?.fileName ?? file?.name}</span>
              <button
                aria-label={t("cans.closeFile", "关闭文档")}
                onClick={() =>
                  requestNavigation(() => {
                    if (file)
                      void fileActions
                        .removeFiles([file.fileId])
                        .catch((error) => setNotice(String(error)));
                    actions.setSelectedTool(null);
                    actions.setWorkbench("viewer");
                  })
                }
              >
                <Icon name="x" size={14} />
              </button>
            </span>
            <div className="cans-file-actions">
              <button
                aria-label={t("cans.open", "打开文件")}
                disabled={opening}
                onClick={() => picker.current?.click()}
              >
                <Icon name="folder-open" size={20} />
              </button>
              <button
                className="cans-save"
                disabled={saving}
                onClick={() => void save()}
              >
                <Icon name="download" size={18} />
                {t("cans.save", "保存")}
              </button>
            </div>
          </>
        )}
        {isDesktop && (
          <div className="cans-window-controls">
            <button
              aria-label={t("cans.minimize", "最小化")}
              title={t("cans.minimize", "最小化")}
              onClick={() => void invokeTauri("app_minimize")}
            >
              <Icon name="minus" size={14} />
            </button>
            <button
              aria-label={t("cans.toggleMaximize", "最大化或还原")}
              title={t("cans.toggleMaximize", "最大化或还原")}
              onClick={() => void invokeTauri("app_toggle_maximize")}
            >
              <Icon name="square" size={12} />
            </button>
            <button
              className="cans-window-close"
              aria-label={t("cans.close", "关闭")}
              title={t("cans.close", "关闭")}
              onClick={() => {
                requestNavigation(() => {
                  void invokeTauri("app_close");
                });
              }}
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        )}
      </header>
      {!hasFiles ? (
        <main className="cans-welcome">
          <h1>{t("cans.welcome", "打开 PDF，开始工作。")}</h1>
          <p>{t("cans.chooseOrDrop", "选择文件，或拖到这里。")}</p>
          <button
            className="cans-open"
            disabled={opening}
            onClick={() => picker.current?.click()}
          >
            <Icon name="folder-open" size={21} />
            {opening
              ? t("cans.opening", "正在打开…")
              : t("cans.open", "打开文件")}
            <kbd>Ctrl O</kbd>
          </button>
          <small>
            <Icon name="shield-check" size={16} />
            {t("cans.local", "文档在本机处理")}
          </small>
        </main>
      ) : (
        <>
          <nav
            className="cans-tools"
            aria-label={t("cans.documentTools", "文档工具")}
          >
            <button
              aria-pressed={!selectedToolKey && workbench === "viewer"}
              onClick={() => changeView("viewer")}
            >
              <Icon name="book-open" size={18} />
              {t("cans.read", "阅读")}
            </button>
            <button
              aria-pressed={selectedToolKey === "pdfTextEditor"}
              onClick={() => handleToolSelect("pdfTextEditor")}
            >
              <Icon name="file-pen" size={18} />
              {t("cans.edit", "编辑原文")}
            </button>
            <button
              aria-pressed={workbench === "pageEditor"}
              onClick={() => changeView("pageEditor")}
            >
              <Icon name="layers" size={18} />
              {t("cans.pages", "页面")}
            </button>
            <button
              aria-pressed={selectedToolKey === "sign"}
              onClick={() => {
                if (selectedToolKey === "sign") {
                  actions.setSelectedTool(null);
                } else {
                  handleToolSelect("sign");
                }
              }}
            >
              <Icon name="signature" size={18} />
              {t("cans.sign", "电子签名")}
            </button>
            <span className="cans-tool-divider" />
            {selectedToolKey !== "pdfTextEditor" && (
              <button
                aria-label={t("cans.find", "查找文字")}
                onClick={() => viewer.searchInterfaceActions.open()}
              >
                <Icon name="search" size={18} />
              </button>
            )}
          </nav>
          <main className="cans-document-body">
            <div className="cans-document">
              <Workbench />
            </div>
            {selectedToolKey && (
              <aside className="cans-properties">
                <RightSidebar />
              </aside>
            )}
          </main>
        </>
      )}
      {notice && (
        <div className="cans-notice" role="status">
          {notice}
          <button
            aria-label={t("cans.dismiss", "关闭提示")}
            onClick={() => setNotice("")}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      )}
      {dragOver && (
        <div className="cans-drop" aria-hidden="true">
          {t("cans.drop", "松开以打开 PDF")}
        </div>
      )}
      <NavigationWarningModal />
    </div>
  );
}
