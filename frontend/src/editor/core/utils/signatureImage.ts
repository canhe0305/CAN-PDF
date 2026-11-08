import { removeWhiteBackground } from "@editor/utils/imageTransparency";
import {
  createCanvas,
  hasCanvasInk,
  imageToCanvas,
  loadImage,
  recolorCanvas,
  rotateCanvas,
  scaleCanvasToFit,
  trimCanvas,
} from "@editor/utils/canvasImage";

export const SIGNATURE_TRIM_PADDING = 6;
const MAX_UPLOAD_SIDE = 1200;
const PHOTO_SPECK_PIXELS = 3;
const PLACED_MAX_WIDTH = 180;
const PLACED_MAX_HEIGHT = 60;

export interface SecurityCertificateBadge {
  enabled: boolean;
  signerName?: string;
  reason?: string;
  date?: string;
  location?: string;
  digest?: string;
}

export interface TypedSignatureOptions {
  text: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  securityBadge?: SecurityCertificateBadge;
}

export function formatAcrobatDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const tzHours = pad(Math.floor(absOffset / 60));
  const tzMinutes = pad(absOffset % 60);

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds} ${sign}${tzHours}'${tzMinutes}'`;
}

export async function computeSecurityDigest(text: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
      const buffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 16);
    }
  } catch {
    // Fallback if subtle crypto is unavailable
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0").substring(0, 16);
}

export async function renderTypedSignature({
  text,
  fontFamily,
  color,
  fontSize,
  securityBadge,
}: TypedSignatureOptions): Promise<string | null> {
  const value = text.trim();
  if (!value) return null;
  const font = `${fontSize}px "${fontFamily}", "STKaiti", "KaiTi", "楷体", "Microsoft YaHei", cursive, sans-serif`;
  await document.fonts?.load(font, value).catch(() => undefined);

  const measureCtx = createCanvas(1, 1).getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = font;
  const metrics = measureCtx.measureText(value);
  const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
  const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.3);
  const pad = Math.round(fontSize * 0.12);

  const cursiveWidth = left + right + pad * 2;
  const cursiveHeight = ascent + descent + pad * 2;

  if (!securityBadge?.enabled) {
    const canvas = createCanvas(cursiveWidth, cursiveHeight);
    const out = canvas.getContext("2d");
    if (!out) return null;
    out.font = font;
    out.fillStyle = color;
    out.fillText(value, pad + left, pad + ascent);
    return canvas.toDataURL("image/png");
  }

  // Adobe Acrobat dual-pane security certificate stamp layout
  const signer = securityBadge.signerName?.trim() || value;
  const dateStr = securityBadge.date || formatAcrobatDate();
  const reasonStr = securityBadge.reason?.trim() || "I approve this document";
  const digestStr = securityBadge.digest || "Digest Verified";
  const orgStr =
    securityBadge.location?.trim() || "CAN PDF Local Security Verification";

  const metaFontSize = Math.max(13, Math.round(fontSize * 0.15));
  const titleFontSize = Math.max(15, Math.round(metaFontSize * 1.15));
  const lineHeight = Math.round(metaFontSize * 1.5);

  const titleFont = `bold ${titleFontSize}px system-ui, -apple-system, sans-serif`;
  const metaFont = `${metaFontSize}px monospace, system-ui, -apple-system, sans-serif`;

  const metaLines = [
    `Digitally signed by ${signer}`,
    `Date: ${dateStr}`,
    `Reason: ${reasonStr}`,
    orgStr,
    `Integrity: SHA-256 ${digestStr} [✓]`,
  ];

  measureCtx.font = titleFont;
  let maxMetaWidth = measureCtx.measureText(metaLines[0]).width;
  measureCtx.font = metaFont;
  for (let i = 1; i < metaLines.length; i++) {
    maxMetaWidth = Math.max(
      maxMetaWidth,
      measureCtx.measureText(metaLines[i]).width,
    );
  }
  maxMetaWidth = Math.ceil(maxMetaWidth);

  const metaHeight = metaLines.length * lineHeight;
  const outerPadding = Math.round(fontSize * 0.16);
  const dividerGap = Math.round(fontSize * 0.22);

  const totalWidth =
    outerPadding + cursiveWidth + dividerGap + maxMetaWidth + outerPadding;
  const contentHeight = Math.max(cursiveHeight, metaHeight);
  const totalHeight = outerPadding * 2 + contentHeight;

  const canvas = createCanvas(totalWidth, totalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background certificate card
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(1, 1, totalWidth - 2, totalHeight - 2, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillRect(1, 1, totalWidth - 2, totalHeight - 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, totalWidth - 2, totalHeight - 2);
  }

  // Left pane: artistic signature text
  const cursiveY =
    outerPadding + (contentHeight - cursiveHeight) / 2 + pad + ascent;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(value, outerPadding + pad + left, cursiveY);

  // Vertical divider line
  const dividerX = outerPadding + cursiveWidth + dividerGap / 2;
  ctx.beginPath();
  ctx.moveTo(dividerX, outerPadding + 6);
  ctx.lineTo(dividerX, totalHeight - outerPadding - 6);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right pane: Acrobat security metadata lines
  const metaX = dividerX + dividerGap / 2;
  const metaStartY =
    outerPadding +
    (contentHeight - metaHeight) / 2 +
    Math.round(metaFontSize * 0.9);

  ctx.font = titleFont;
  ctx.fillStyle = "#111827";
  ctx.fillText(metaLines[0], metaX, metaStartY);

  ctx.font = metaFont;
  ctx.fillStyle = "#374151";
  for (let i = 1; i < metaLines.length; i++) {
    ctx.fillText(metaLines[i], metaX, metaStartY + i * lineHeight);
  }

  return canvas.toDataURL("image/png");
}

export interface UploadCleanup {
  removeBackground: boolean;
  trim: boolean;
  inkColor: string | null;
  quarterTurns: number;
}

async function removePaper(source: string): Promise<HTMLCanvasElement> {
  const transparent = await removeWhiteBackground(source, {
    autoDetectCorner: true,
    tolerance: 15,
  });
  return imageToCanvas(await loadImage(transparent));
}

export const PHONE_DRAWING_CLEANUP: UploadCleanup = {
  removeBackground: false,
  trim: true,
  inkColor: null,
  quarterTurns: 0,
};

export async function cleanUpSignatureImage(
  source: string,
  { removeBackground, trim, inkColor, quarterTurns }: UploadCleanup,
): Promise<string> {
  const photo = scaleCanvasToFit(
    imageToCanvas(await loadImage(source)),
    MAX_UPLOAD_SIDE,
  );
  const base = removeBackground
    ? await removePaper(photo.toDataURL("image/png"))
    : photo;
  let canvas = rotateCanvas(base, quarterTurns);
  if (trim) {
    canvas = trimCanvas(canvas, {
      treatPaperAsEmpty: !removeBackground,
      padding: SIGNATURE_TRIM_PADDING,
      minInkPerLine: PHOTO_SPECK_PIXELS,
    });
  }
  if (removeBackground && inkColor) {
    recolorCanvas(canvas, inkColor);
  }
  if (!hasCanvasInk(canvas))
    throw new Error("The signature image has no visible ink");
  return canvas.toDataURL("image/png");
}

export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return `${words[0].charAt(0)}${last}`.toUpperCase();
}

export function fitPlacedSignatureSize(width: number, height: number) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const scale = Math.min(
    PLACED_MAX_WIDTH / safeWidth,
    PLACED_MAX_HEIGHT / safeHeight,
  );
  return { width: safeWidth * scale, height: safeHeight * scale };
}
