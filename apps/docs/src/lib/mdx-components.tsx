import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  Box,
  ChartNoAxesColumnIncreasing,
  Crown,
  SquareDashedMousePointer,
} from "lucide-react";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    Steps,
    Step,
    Box,
    ChartNoAxesColumnIncreasing,
    SquareDashedMousePointer,
    Crown,
    ...components,
  };
}
