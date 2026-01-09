import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

export function getMDXComponents(): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1
        className="mb-4 scroll-m-20 font-bold text-4xl tracking-tight lg:text-5xl"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="mt-8 mb-4 scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="mt-8 mb-4 scroll-m-20 font-semibold text-2xl tracking-tight"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="mt-6 mb-3 scroll-m-20 font-semibold text-xl tracking-tight"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mt-2" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="mt-6 border-neutral-300 border-l-2 pl-6 italic dark:border-neutral-700"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }) => (
      <code
        className="relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm dark:bg-neutral-800"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre
        className="mt-6 mb-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
        {...props}
      >
        {children}
      </pre>
    ),
    a: ({ href, children, ...props }) => (
      <Link
        className="font-medium underline underline-offset-4 hover:text-neutral-600 dark:hover:text-neutral-400"
        href={href || "#"}
        {...props}
      >
        {children}
      </Link>
    ),
    img: ({ src, alt, ...props }) => (
      <Image
        alt={alt || ""}
        className="my-8 rounded-lg"
        height={400}
        src={src || ""}
        width={800}
        {...props}
      />
    ),
    hr: ({ ...props }) => (
      <hr
        className="my-8 border-neutral-200 dark:border-neutral-800"
        {...props}
      />
    ),
    table: ({ children, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-b" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr
        className="m-0 border-t p-0 even:bg-neutral-50 dark:even:bg-neutral-900"
        {...props}
      >
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </td>
    ),
  };
}
