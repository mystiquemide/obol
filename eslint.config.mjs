import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Literal apostrophes/quotes in copy render fine; this rule is noise.
      "react/no-unescaped-entities": "off",
      // The UI uses styled anchors by design. Migrating internal navigation to
      // next/link is tracked on the roadmap; disabled for consistency until then.
      "@next/next/no-html-link-for-pages": "off",
      // React Compiler advisory rules. They fire inconsistently (only when the
      // compiler fully analyzes a component, so an unrelated edit elsewhere can
      // flip them on), and they flag intentional patterns here: passing a ref to
      // a `ref=` prop and standard data-fetching effects. Off for deterministic
      // lint; React Compiler adoption is tracked on the roadmap.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
