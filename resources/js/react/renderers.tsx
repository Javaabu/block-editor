import * as React from "react"

import { columnsTemplate } from "../blocks/columns"
import { directionOf } from "../direction"
import { toEmbedUrl } from "../embeds"
import { cleanHtml } from "../html"
import type { BlockRenderProps, Translate } from "../registry"
import { isSafeImageUrl, isSafeUrl } from "../url"

/*
 * React renderers of the core blocks. Each renders exactly what its Blade view
 * (resources/views/blocks) renders: tests/js/fixtures.test.tsx checks both against
 * tests/fixtures/content.
 */

type Renderer = (props: BlockRenderProps & { t: Translate }) => React.ReactNode

const align = (attrs: Record<string, unknown>) =>
  typeof attrs.textAlign === "string" && attrs.textAlign
    ? { textAlign: attrs.textAlign as "start" | "center" | "end" }
    : undefined

const dirOf = (attrs: Record<string, unknown>) => (attrs.dir === "ltr" || attrs.dir === "rtl" ? attrs.dir : "auto")

const cellProps = (attrs: Record<string, unknown>) => ({
  colSpan: Number(attrs.colspan ?? 1) > 1 ? Number(attrs.colspan) : undefined,
  rowSpan: Number(attrs.rowspan ?? 1) > 1 ? Number(attrs.rowspan) : undefined,
  dir: dirOf(attrs),
})

function textContent(node: BlockRenderProps["node"]): string {
  return (node.text ?? "") + (node.content ?? []).map(textContent).join("")
}

export const CORE_RENDERERS: Record<string, Renderer> = {
  paragraph: ({ attrs, children }) => (
    <p dir={dirOf(attrs)} style={align(attrs)}>
      {children}
    </p>
  ),
  heading: ({ attrs, children }) => {
    const level = Math.min(6, Math.max(1, Number(attrs.level ?? 2) || 2))
    return React.createElement(`h${level}`, { dir: dirOf(attrs), style: align(attrs) }, children)
  },
  bulletList: ({ node, children }) => <ul dir={directionOf(node)}>{children}</ul>,
  orderedList: ({ node, attrs, children }) => (
    <ol
      start={Number(attrs.start ?? 1) !== 1 ? Number(attrs.start) : undefined}
      type={(attrs.type as "1" | "a" | "A" | "i" | "I" | null) ?? undefined}
      dir={directionOf(node)}
    >
      {children}
    </ol>
  ),
  listItem: ({ children }) => <li>{children}</li>,
  blockquote: ({ node, children }) => <blockquote dir={directionOf(node)}>{children}</blockquote>,
  codeBlock: ({ node, attrs }) => (
    <pre className="block-code" dir="ltr">
      <code className={attrs.language ? `language-${String(attrs.language)}` : undefined}>{textContent(node)}</code>
    </pre>
  ),
  horizontalRule: () => <hr />,
  hardBreak: () => <br />,
  callout: ({ attrs, children }) => (
    <div
      className="block-callout"
      data-variant={(attrs.variant as string | null) ?? "info"}
      role="note"
      dir={dirOf(attrs)}
    >
      {children}
    </div>
  ),
  table: ({ node, children }) => {
    const dir = directionOf(node)
    return (
      <div className="block-table" dir={dir}>
        <table dir={dir}>
          <tbody>{children}</tbody>
        </table>
      </div>
    )
  },
  tableRow: ({ children }) => <tr>{children}</tr>,
  tableCell: ({ attrs, children }) => <td {...cellProps(attrs)}>{children}</td>,
  tableHeader: ({ attrs, children }) => <th {...cellProps(attrs)}>{children}</th>,
  image: ({ attrs }) => {
    if (!isSafeImageUrl(attrs.src)) return null
    return (
      <figure className="block-image">
        <img
          src={attrs.src}
          alt={(attrs.alt as string | null) ?? ""}
          title={(attrs.title as string | null) ?? undefined}
          loading="lazy"
          decoding="async"
        />
        {attrs.caption ? <figcaption dir="auto">{String(attrs.caption)}</figcaption> : null}
      </figure>
    )
  },
  embed: ({ attrs, t }) => {
    const src = attrs.src
    if (!isSafeUrl(src)) return null
    const url = toEmbedUrl(src)
    const title = (attrs.title as string | null) || t("embeddedContent")
    if (!url) {
      return (
        <p className="block-embed" dir="auto">
          <a href={src} rel="noopener noreferrer nofollow">
            {(attrs.title as string | null) || src}
          </a>
        </p>
      )
    }
    return (
      <figure className="block-embed">
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </figure>
    )
  },
  button: ({ attrs }) => {
    if (!attrs.text || !isSafeUrl(attrs.url)) return null
    const newTab = !!attrs.newTab
    return (
      <div className="block-button" data-align={(attrs.align as string | null) ?? "start"}>
        <a
          href={attrs.url}
          className="block-button__link"
          data-variant={(attrs.variant as string | null) ?? "primary"}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          dir="auto"
        >
          {String(attrs.text)}
        </a>
      </div>
    )
  },
  html: ({ attrs }) => {
    const html = typeof attrs.html === "string" ? cleanHtml(attrs.html).trim() : ""
    return html ? <div className="block-html" dangerouslySetInnerHTML={{ __html: html }} /> : null
  },
  columns: ({ node, attrs, children }) => (
    <div
      className="block-columns"
      data-stack={(attrs.stackAt as string | null) ?? "md"}
      data-gap={(attrs.gap as string | null) ?? "md"}
      data-align={(attrs.verticalAlign as string | null) ?? "stretch"}
      style={{ "--block-columns": columnsTemplate(attrs.layout, node.content?.length ?? 0) } as React.CSSProperties}
    >
      {children}
    </div>
  ),
  column: ({ children }) => <div className="block-column">{children}</div>,
}

const MARKS: Record<string, (attrs: Record<string, unknown>, children: React.ReactNode) => React.ReactNode> = {
  bold: (_attrs, children) => <strong>{children}</strong>,
  italic: (_attrs, children) => <em>{children}</em>,
  underline: (_attrs, children) => <u>{children}</u>,
  strike: (_attrs, children) => <s>{children}</s>,
  code: (_attrs, children) => <code dir="ltr">{children}</code>,
  link: (attrs, children) =>
    isSafeUrl(attrs.href) ? (
      <a href={attrs.href} target={attrs.target === "_blank" ? "_blank" : undefined} rel="noopener noreferrer nofollow">
        {children}
      </a>
    ) : (
      children
    ),
}

export type MarkRenderer = (attrs: Record<string, unknown>, children: React.ReactNode) => React.ReactNode

export const CORE_MARKS: Record<string, MarkRenderer> = MARKS
