import { useMemo } from "react";
import { BASE_PATH } from "@editor/constants/app";

const LOGO_FOLDER = "modern-logo";

export function useLogoAssets() {
  return useMemo(() => {
    const folderPath = `${BASE_PATH}/${LOGO_FOLDER}`;

    return {
      folderPath,
      getAssetPath: (name: string) => `${folderPath}/${name}`,
      wordmark: {
        black: `${folderPath}/StirlingPDFLogoBlackText.svg`,
        grey: `${folderPath}/StirlingPDFLogoGreyText.svg`,
        white: `${folderPath}/StirlingPDFLogoWhiteText.svg`,
      },
      tooltipLogo: `${folderPath}/logo-tooltip.svg`,
      firstPage: `${folderPath}/Firstpage.png`,
      favicon: `${BASE_PATH}/cans-icon.svg`,
      logo192: `${BASE_PATH}/cans-icon.svg`,
      logo512: `${BASE_PATH}/cans-icon.svg`,
      manifestHref: `${BASE_PATH}/manifest.json`,
    };
  }, []);
}
