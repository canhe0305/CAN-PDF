// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { parseTrueTypeCmap } from "@editor/tools/pdfTextEditor/charcode/CmapResolver";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("loads a real bundled TrueType face covering the Chinese edit regression", async () => {
  const bytes = new Uint8Array(
    readFileSync(
      "../app/core/src/main/resources/static/fonts/NotoSansSC-Regular.ttf",
    ),
  );
  const fetcher = vi.fn(async () => new Response(bytes.slice().buffer));
  vi.stubGlobal("fetch", fetcher);
  const { preloadFallbackFontBytes, isFallbackFontReady } =
    await import("@editor/tools/pdfTextEditor/util/fallbackFont");
  const loaded = await preloadFallbackFontBytes();
  expect(isFallbackFontReady()).toBe(true);
  expect(fetcher).toHaveBeenCalledWith("/fonts/NotoSansSC-Regular.ttf");
  const cmap = parseTrueTypeCmap(loaded!);
  for (const character of "原文编辑验证CANS2026")
    expect(cmap?.has(character.codePointAt(0)!)).toBe(true);
  expect(await preloadFallbackFontBytes()).toBe(loaded);
  expect(fetcher).toHaveBeenCalledOnce();
});
it("rejects an HTML fallback response and retries the next font request", async () => {
  vi.resetModules();
  const bytes = new Uint8Array(
    readFileSync(
      "../app/core/src/main/resources/static/fonts/NotoSansSC-Regular.ttf",
    ),
  );
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("<!doctype html><title>missing</title>"),
    )
    .mockResolvedValueOnce(new Response(bytes.slice().buffer));
  vi.stubGlobal("fetch", fetcher);
  const font = await import("@editor/tools/pdfTextEditor/util/fallbackFont");
  expect(await font.preloadFallbackFontBytes()).toBeNull();
  expect(font.isFallbackFontReady()).toBe(false);
  expect(await font.preloadFallbackFontBytes()).not.toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
