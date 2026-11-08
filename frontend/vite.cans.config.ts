import { defineConfig } from "vite";
// oxlint-disable-next-line no-restricted-imports -- Build config runs before workspace aliases are available.
import upstream from "./vite.config";

// A static desktop workspace has no Java classpath to serve pruned fonts from.
export default defineConfig(async (environment) => {
  const config = await upstream({ ...environment, mode: "core" });
  return {
    ...config,
    plugins: (config.plugins ?? []).filter(
      (plugin) =>
        !(
          plugin &&
          typeof plugin === "object" &&
          "name" in plugin &&
          ["compress-static-copy", "prerender-og"].includes(String(plugin.name))
        ),
    ),
    build: { ...config.build, outDir: "dist-cans" },
  };
});
