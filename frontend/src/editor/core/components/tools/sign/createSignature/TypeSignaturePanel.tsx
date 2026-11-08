import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@editor/ui/Checkbox";
import { FormField } from "@editor/ui/FormField";
import { Input } from "@editor/ui/Input";
import {
  computeSecurityDigest,
  deriveInitials,
  renderTypedSignature,
  type SecurityCertificateBadge,
} from "@editor/utils/signatureImage";
import { Icon } from "@editor/ui/Icon";
import { InkSwatches } from "@editor/components/tools/sign/createSignature/InkSwatches";
import { SignatureStylePicker } from "@editor/components/tools/sign/createSignature/SignatureStylePicker";
import {
  DEFAULT_INK,
  INK_COLORS,
  SIGNATURE_FONTS,
  type InkColor,
  type SignatureFont,
} from "@editor/components/tools/sign/createSignature/signatureStyles";
import type {
  CreatedSignature,
  TypePanelHandle,
  TypedSignatureSource,
} from "@editor/components/tools/sign/createSignature/types";
import styles from "@editor/components/tools/sign/createSignature/TypeSignaturePanel.module.css";
import { privateContentClassName } from "@editor/components/shared/privateContentClassName";

const RENDER_FONT_SIZE = 120;

async function renderSource(
  source: TypedSignatureSource,
  securityBadge?: SecurityCertificateBadge,
): Promise<string | null> {
  return renderTypedSignature({
    text: source.signerName,
    fontFamily: source.fontFamily,
    color: source.textColor,
    fontSize: source.fontSize,
    ...(securityBadge ? { securityBadge } : {}),
  });
}

interface TypeSignaturePanelProps {
  onReadyChange: (ready: boolean) => void;
  saveEnabled: boolean;
  canSaveInitials: boolean;
}

export const TypeSignaturePanel = forwardRef<
  TypePanelHandle,
  TypeSignaturePanelProps
>(function TypeSignaturePanel(
  { onReadyChange, saveEnabled, canSaveInitials },
  ref,
) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [initialsOverride, setInitialsOverride] = useState<string | null>(null);
  const [font, setFont] = useState<SignatureFont>(SIGNATURE_FONTS[0]);
  const [ink, setInk] = useState<InkColor>(DEFAULT_INK);
  const [includeInitials, setIncludeInitials] = useState(true);
  const [includeBadge, setIncludeBadge] = useState(false);
  const [reason, setReason] = useState("");

  const initials = initialsOverride ?? deriveInitials(name);
  const hasName = name.trim().length > 0;
  const savesInitials =
    saveEnabled &&
    canSaveInitials &&
    includeInitials &&
    Boolean(initials.trim());

  useEffect(() => onReadyChange(hasName), [hasName, onReadyChange]);

  async function getResult(): Promise<CreatedSignature | null> {
    const style = {
      fontFamily: font.family,
      fontSize: RENDER_FONT_SIZE,
      textColor: ink.value,
    };
    const text = { signerName: name.trim(), ...style };
    const securityBadge: SecurityCertificateBadge | undefined = includeBadge
      ? {
          enabled: true,
          signerName: name.trim(),
          reason:
            reason.trim() ||
            t("sign.wallet.type.reasonDefault", "确认签署此文档"),
          digest: await computeSecurityDigest(name.trim()),
        }
      : undefined;

    const dataUrl = await renderSource(text, securityBadge);
    if (!dataUrl) return null;
    const initialsSource = { signerName: initials.trim(), ...style };
    const initialsUrl = savesInitials
      ? await renderSource(initialsSource)
      : null;
    return {
      source: "type",
      type: "text",
      dataUrl,
      text,
      initials: initialsUrl
        ? { ...initialsSource, dataUrl: initialsUrl }
        : undefined,
    };
  }

  useImperativeHandle(ref, () => ({
    setName: (nextName, style) => {
      setName(nextName);
      setInitialsOverride(null);
      if (!style) return;
      setFont(
        SIGNATURE_FONTS.find((entry) => entry.family === style.fontFamily) ?? {
          family: style.fontFamily,
          previewScale: 1,
        },
      );
      setInk(
        INK_COLORS.find((entry) => entry.value === style.textColor) ?? {
          ...DEFAULT_INK,
          value: style.textColor,
        },
      );
    },
    getResult,
  }));

  return (
    <div className={styles.panel}>
      <div className={styles.nameRow}>
        <FormField label={t("sign.wallet.type.name", "Your name")}>
          <Input
            value={name}
            className={privateContentClassName}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder={t(
              "sign.wallet.type.namePlaceholder",
              "Type your name",
            )}
            maxLength={80}
            data-testid="signature-type-name"
          />
        </FormField>
        <FormField label={t("sign.wallet.type.initials", "Initials")}>
          <Input
            value={initials}
            className={privateContentClassName}
            onChange={(event) => setInitialsOverride(event.currentTarget.value)}
            maxLength={6}
          />
        </FormField>
      </div>
      <SignatureStylePicker
        text={name}
        ink={ink.value}
        value={font}
        onChange={setFont}
      />
      <div className={styles.badgeSection}>
        <Checkbox
          label={t(
            "sign.wallet.type.acrobatBadge",
            "附加 Adobe Acrobat 风格数字安全认证徽章",
          )}
          checked={includeBadge}
          onChange={(event) => setIncludeBadge(event.currentTarget.checked)}
        />
        {includeBadge && (
          <div className={styles.badgeFields}>
            <FormField label={t("sign.wallet.type.reason", "签署意图 / 理由")}>
              <Input
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
                placeholder={t(
                  "sign.wallet.type.reasonPlaceholder",
                  "确认签署此文档 (I approve this document)",
                )}
                maxLength={60}
              />
            </FormField>
            <div className={styles.badgeHint}>
              <Icon name="shield-check" size={14} />
              <span>
                {t(
                  "sign.wallet.type.badgeDesc",
                  "生成包含签署人、防伪时间戳与 SHA-256 哈希校验的双栏证书印章。",
                )}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <InkSwatches value={ink} onChange={setInk} />
        <Checkbox
          label={t("sign.wallet.type.saveInitials", "Also save my initials")}
          checked={savesInitials}
          disabled={!saveEnabled || !canSaveInitials || !initials.trim()}
          description={
            saveEnabled && !canSaveInitials
              ? t(
                  "sign.wallet.type.initialsLimit",
                  "Saving initials needs two free signature slots.",
                )
              : undefined
          }
          onChange={(event) => setIncludeInitials(event.currentTarget.checked)}
        />
      </div>
    </div>
  );
});
