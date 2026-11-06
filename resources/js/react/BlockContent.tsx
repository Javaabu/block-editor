import * as React from "react"

// The stylesheet, so Vite bundles it with any page that renders this (Inertia pages get no manifest tags).
import "../block-editor.css"

import { isEmptyDocument, parseContent } from "../editor/content"
import { defaultConfig } from "../editor/create"
import { getBlock, type BlockRenderProps, type Translate } from "../registry"
import { translator } from "../strings"
import type { EditorConfig, JSONDocument, JSONNode } from "../types"
import { CORE_MARKS, CORE_RENDERERS, type MarkRenderer } from "./renderers"

export interface BlockContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "children"> {
  /** Block editor content: TipTap JSON (`$post->body` from Inertia) or a JSON string. */
  content?: JSONDocument | string | null
  /**
   * HTML the server rendered (`$post->body->toHtml()`), shown as is instead of
   * rendering `content`. Use it for blocks that only have a Blade view.
   */
  html?: string | null
  /** The editor config, for the strings (default: the built-in English one). */
  config?: EditorConfig
  /** Renderers by node type, over the core ones and the registered blocks' `render`. */
  renderers?: Record<string, React.ComponentType<BlockRenderProps>>
  /** Renderers by mark type. */
  marks?: Record<string, MarkRenderer>
  /** Shown when there's no content. */
  empty?: React.ReactNode
}

interface Context {
  t: Translate
  renderers?: Record<string, React.ComponentType<BlockRenderProps>>
  marks?: Record<string, MarkRenderer>
  config: EditorConfig
}

function renderText(node: JSONNode, context: Context, key: React.Key): React.ReactNode {
  let element: React.ReactNode = node.text ?? ""
  for (const mark of [...(node.marks ?? [])].reverse()) {
    const render = context.marks?.[mark.type] ?? CORE_MARKS[mark.type]
    if (render) element = render(mark.attrs ?? {}, element)
  }
  return <React.Fragment key={key}>{element}</React.Fragment>
}

function renderNode(node: JSONNode, context: Context, key: React.Key): React.ReactNode {
  if (node.type === "text") return renderText(node, context, key)
  const children = node.content?.length
    ? node.content.map((child, index) => renderNode(child, context, index))
    : undefined
  const attrs = node.attrs ?? {}
  const block = context.config.blocks.find((b) => b.name === node.type)
  const props: BlockRenderProps = { node, attrs, children, block }

  const Custom = context.renderers?.[node.type] ?? getBlock(node.type)?.render
  if (Custom) return <Custom key={key} {...props} />

  const core = CORE_RENDERERS[node.type]
  if (core) return <React.Fragment key={key}>{core({ ...props, t: context.t })}</React.Fragment>

  // A block with only a Blade view: keep its text readable.
  return children ? (
    <div key={key} data-block={node.type}>
      {children}
    </div>
  ) : null
}

/**
 * Renders block editor content in React, with the same markup as
 * `<x-block-editor::content>`. Pair it with the stylesheet (`block-editor::styles`
 * or `@javaabu/block-editor/css`).
 *
 * Content is expected to be sanitized on the server (the `AsBlockDocument` cast
 * does it); text is escaped, unsafe URLs are dropped, and HTML blocks are cleaned
 * again in the browser.
 */
export function BlockContent({
  content,
  html,
  config,
  renderers,
  marks,
  empty = null,
  className,
  ...props
}: BlockContentProps) {
  const resolved = config ?? defaultConfig()
  const doc = React.useMemo(() => parseContent(content), [content])
  const t = React.useMemo(() => translator(resolved.strings, defaultConfig().strings), [resolved])
  const classes = ["block-content", className].filter(Boolean).join(" ")

  if (typeof html === "string") {
    if (!html.trim()) return <>{empty}</>
    return <div className={classes} {...props} dangerouslySetInnerHTML={{ __html: html }} />
  }

  if (!doc || isEmptyDocument(doc)) return <>{empty}</>

  const context: Context = { t, renderers, marks, config: resolved }
  return (
    <div className={classes} {...props}>
      {doc.content.map((node, index) => renderNode(node, context, index))}
    </div>
  )
}
