import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CansWorkspace } from "@editor/components/cans/CansWorkspace";
import { createTestStirlingFile } from "@editor/tests/utils/testFileHelpers";

const mocks = vi.hoisted(() => ({
  addFiles: vi.fn(),
  download: vi.fn(),
  exportCopy: vi.fn(),
  setWorkbench: vi.fn(),
  setTool: vi.fn(),
  removeFiles: vi.fn(),
  updatePreference: vi.fn(),
  requestNavigation: vi.fn(),
  pick: vi.fn(),
  editDownload: vi.fn(),
  files: [] as unknown[],
  editing: false,
  editorId: null as string | null,
  viewerId: null as string | null,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock("@editor/contexts/file/fileHooks", () => ({
  useFileContext: () => ({ activeFiles: mocks.files }),
  useFileActions: () => ({ actions: { removeFiles: mocks.removeFiles } }),
}));
vi.mock("@editor/hooks/useFileHandler", () => ({
  useFileHandler: () => ({ addFiles: mocks.addFiles }),
}));
vi.mock("@editor/contexts/NavigationContext", () => ({
  useNavigationActions: () => ({
    actions: {
      setWorkbench: mocks.setWorkbench,
      setSelectedTool: mocks.setTool,
    },
  }),
  useNavigationState: () => ({ workbench: "viewer" }),
  useNavigationGuard: () => ({ requestNavigation: mocks.requestNavigation }),
}));
vi.mock("@editor/contexts/ToolWorkflowContext", () => ({
  useToolWorkflow: () => ({
    handleToolSelect: mocks.setTool,
    selectedToolKey: null,
  }),
}));
vi.mock("@editor/contexts/ViewerContext", () => ({
  useViewer: () => ({
    activeFileId: mocks.viewerId,
    exportActions: { saveAsCopy: mocks.exportCopy },
    searchInterfaceActions: { open: vi.fn() },
  }),
}));
vi.mock("@editor/tools/pdfTextEditor/store/EditorSession", () => ({
  useEditorSession: () =>
    mocks.editing
      ? {
          download: mocks.editDownload,
          fileId: mocks.editorId,
          fileName: "editing.pdf",
          pickFile: vi.fn(),
          pickDiskFile: mocks.pick,
        }
      : null,
}));
vi.mock("@editor/contexts/WorkbenchBarContext", () => ({
  useWorkbenchBar: () => ({ viewFileActions: null }),
}));
vi.mock("@editor/services/downloadService", () => ({
  downloadFile: mocks.download,
}));
vi.mock("@editor/contexts/PreferencesContext", () => ({
  usePreferences: () => ({ updatePreference: mocks.updatePreference }),
}));
vi.mock("@editor/ui/Icon", () => ({ Icon: () => null }));
vi.mock("@editor/components/layout/Workbench", () => ({ default: () => null }));
vi.mock("@editor/components/tools/RightSidebar", () => ({
  default: () => null,
}));
vi.mock("@editor/components/shared/NavigationWarningModal", () => ({
  default: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.files = [];
  mocks.editing = false;
  mocks.editorId = null;
  mocks.viewerId = null;
  mocks.removeFiles.mockResolvedValue(undefined);
  mocks.addFiles.mockResolvedValue([]);
  mocks.download.mockResolvedValue({});
  mocks.requestNavigation.mockImplementation((action: () => void) => action());
});
describe("CANS workspace document boundaries", () => {
  it("closes the editor's current document when the reader points at another file", () => {
    const first = createTestStirlingFile("first.pdf");
    const second = createTestStirlingFile("second.pdf");
    mocks.files = [first, second];
    mocks.editing = true;
    mocks.editorId = second.fileId;
    mocks.viewerId = first.fileId;
    render(<CansWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "关闭文档" }));
    expect(mocks.removeFiles).toHaveBeenCalledWith([second.fileId]);
  });
  it("waits for navigation approval before importing a replacement document", async () => {
    mocks.requestNavigation.mockImplementation(() => {});
    const { container } = render(<CansWorkspace />);
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["pdf"], "new.pdf")] },
    });
    expect(mocks.requestNavigation).toHaveBeenCalledOnce();
    expect(mocks.addFiles).not.toHaveBeenCalled();
    expect(mocks.setWorkbench).not.toHaveBeenCalled();
  });
  it("uses the editor's guarded open entry while editing", () => {
    mocks.editing = true;
    const { container } = render(<CansWorkspace />);
    const file = new File(["pdf"], "new.pdf");
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    expect(mocks.pick).toHaveBeenCalledWith(file);
    expect(mocks.addFiles).not.toHaveBeenCalled();
  });
  it("downloads the viewer's current exported bytes instead of its source file", async () => {
    mocks.files = [createTestStirlingFile("test.pdf", "old")];
    mocks.exportCopy.mockResolvedValue(new Uint8Array([4, 5, 6]).buffer);
    render(<CansWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalledOnce());
    expect(mocks.download.mock.calls[0][0].data).toBeInstanceOf(Blob);
    expect(mocks.download.mock.calls[0][0].filename).toBe("test.pdf");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "请确认文件已保存",
    );
  });
  it("delegates editor export to the live editor session", async () => {
    mocks.files = [createTestStirlingFile("test.pdf", "old")];
    mocks.editing = true;
    render(<CansWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(mocks.editDownload).toHaveBeenCalledOnce();
    expect(mocks.exportCopy).not.toHaveBeenCalled();
    expect(mocks.download).not.toHaveBeenCalled();
  });
  it("does not close the active file when the navigation guard declines", () => {
    mocks.files = [createTestStirlingFile("test.pdf", "old")];
    mocks.requestNavigation.mockImplementation(() => {});
    render(<CansWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "关闭文档" }));
    expect(mocks.removeFiles).not.toHaveBeenCalled();
  });
  it("renders and handles window controls in desktop environment", async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    (
      window as unknown as { __TAURI_INTERNALS__: unknown }
    ).__TAURI_INTERNALS__ = {
      invoke,
    };
    try {
      render(<CansWorkspace />);
      const minBtn = screen.getByRole("button", { name: "最小化" });
      const maxBtn = screen.getByRole("button", { name: "最大化或还原" });
      const closeBtn = screen.getByRole("button", { name: "关闭" });
      expect(minBtn).toBeInTheDocument();
      expect(maxBtn).toBeInTheDocument();
      expect(closeBtn).toBeInTheDocument();

      fireEvent.click(minBtn);
      expect(invoke).toHaveBeenCalledWith("app_minimize", undefined);

      fireEvent.click(maxBtn);
      expect(invoke).toHaveBeenCalledWith("app_toggle_maximize", undefined);

      fireEvent.click(closeBtn);
      expect(mocks.requestNavigation).toHaveBeenCalled();
      expect(invoke).toHaveBeenCalledWith("app_close", undefined);
    } finally {
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__;
    }
  });
});
