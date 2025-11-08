import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { JSX } from "react";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { BundledLanguage } from "shiki";
import { codeToHast } from "shiki";

interface Props {
  children: string;
  language: BundledLanguage;
  lineNumbers?: boolean;
}

export async function CodeBlock(props: Props) {
  const showLineNumbers = props.lineNumbers ?? false;

  const out = await codeToHast(props.children, {
    lang: props.language,
    theme: "nord",
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (preProps) => (
        <div
          className="rounded-lg overflow-clip"
          data-line-numbers={showLineNumbers ? "true" : "false"}
        >
          <pre
            data-custom-codeblock
            {...preProps}
            className="dark:!bg-input/30 border-input w-full min-w-0 rounded-md border p-3 text-sm shadow-xs"
          />
        </div>
      ),
    },
  }) as JSX.Element;
}
