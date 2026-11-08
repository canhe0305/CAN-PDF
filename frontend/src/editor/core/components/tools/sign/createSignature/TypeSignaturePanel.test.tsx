import { createRef } from "react";
import { MantineProvider } from "@mantine/core";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TypeSignaturePanel } from "@editor/components/tools/sign/createSignature/TypeSignaturePanel";
import type { TypePanelHandle } from "@editor/components/tools/sign/createSignature/types";
import { renderTypedSignature } from "@editor/utils/signatureImage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));
vi.mock("@editor/utils/signatureImage", () => ({
  deriveInitials: (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join(""),
  renderTypedSignature: vi.fn(async () => "data:image/png;base64,signature"),
  computeSecurityDigest: vi.fn(async () => "0123456789abcdef"),
}));

describe("TypeSignaturePanel phone text", () => {
  it("retains a phone font and custom ink when rendering the received name", async () => {
    const panel = createRef<TypePanelHandle>();
    render(
      <MantineProvider>
        <TypeSignaturePanel
          ref={panel}
          onReadyChange={vi.fn()}
          saveEnabled={false}
          canSaveInitials={false}
        />
      </MantineProvider>,
    );
    act(() =>
      panel.current?.setName("Alex Doe", {
        fontFamily: "Georgia",
        textColor: "#cc3399",
      }),
    );
    expect(screen.getByTestId("signature-type-name")).toHaveValue("Alex Doe");
    expect(
      screen
        .getAllByRole("radio", { name: /ink$/i })
        .every((radio) => radio.getAttribute("aria-checked") === "false"),
    ).toBe(true);
    const result = await panel.current?.getResult();
    expect(result?.text).toEqual({
      signerName: "Alex Doe",
      fontFamily: "Georgia",
      fontSize: 120,
      textColor: "#cc3399",
    });
    expect(renderTypedSignature).toHaveBeenCalledWith({
      text: "Alex Doe",
      fontFamily: "Georgia",
      fontSize: 120,
      color: "#cc3399",
    });
  });

  it("includes Acrobat security badge when enabled", async () => {
    const panel = createRef<TypePanelHandle>();
    render(
      <MantineProvider>
        <TypeSignaturePanel
          ref={panel}
          onReadyChange={vi.fn()}
          saveEnabled={false}
          canSaveInitials={false}
        />
      </MantineProvider>,
    );
    act(() => {
      panel.current?.setName("Jane Smith");
    });
    const badgeCheckbox = screen.getByRole("checkbox", {
      name: /Acrobat/i,
    });
    act(() => {
      badgeCheckbox.click();
    });
    await panel.current?.getResult();
    expect(renderTypedSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Jane Smith",
        securityBadge: expect.objectContaining({
          enabled: true,
          signerName: "Jane Smith",
        }),
      }),
    );
  });
});
