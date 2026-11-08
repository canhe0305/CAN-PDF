import { Suspense } from "react";
import { AppProviders } from "@editor/components/AppProviders";
import { PlatformProviders } from "@editor/components/PlatformProviders";
import { QuickNavHostProvider } from "@editor/contexts/QuickNavHostContext";
import { LoadingFallback } from "@editor/components/shared/LoadingFallback";
import { CansWorkspace } from "@editor/components/cans/CansWorkspace";
import type { AppConfig } from "@editor/types/appConfig";
import { TitleBarStripContext } from "@editor/contexts/TitleBarStripContext";
import i18n from "@editor/i18n";
import copy from "@editor/components/cans/copy.json";
import "@editor/styles/tailwind.css";
import "@editor/styles/index.css";

i18n.addResourceBundle("zh-CN", "translation", { cans: copy.zh }, true, true);

const localConfig: AppConfig = {
  appNameNavbar: "CANS",
  enableLogin: false,
  enableAnalytics: false,
  enablePosthog: false,
  enableScarf: false,
  enableFeedback: false,
  enableEasterEggs: false,
  premiumEnabled: false,
  storageEnabled: false,
  accountLinkAvailable: false,
  defaultLocale: "zh-CN",
  languages: ["zh-CN", "en-US"],
  defaultToolPanelMode: "sidebar",
  defaultHideUnavailableTools: true,
};

export default function CansApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlatformProviders
        appConfigProviderProps={{
          initialConfig: localConfig,
          autoFetch: false,
          bootstrapMode: "non-blocking",
        }}
      >
        <QuickNavHostProvider>
          <TitleBarStripContext.Provider
            value={{
              enabled: true,
              viewsSlot: null,
              searchSlot: null,
              globalsSlot: null,
            }}
          >
            <AppProviders>
              <CansWorkspace />
            </AppProviders>
          </TitleBarStripContext.Provider>
        </QuickNavHostProvider>
      </PlatformProviders>
    </Suspense>
  );
}
