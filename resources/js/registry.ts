import type { AnyExtension, Editor } from "@tiptap/core"
import type { ComponentType, ReactNode } from "react"

import type { BlockConfig, EditorConfig, JSONNode } from "./types"

/** What a block's extensions are built with. */
export interface ExtensionContext {
  /** The block's config from PHP. */
  block: BlockConfig
  /** The whole editor config. */
  config: EditorConfig
  /** True when another block of the config is present (`has("listItem")`). */
  has: (name: string) => boolean
}

/** One entry of the "/" and "+" menus. */
export interface MenuItem {
  /** Unique id, e.g. `heading:2`. */
  id: string
  block: string
  title: string
  description?: string
  icon: string
  keywords: string[]
  category: string
  /** Node attributes the item inserts with. */
  attrs?: Record<string, unknown>
}

export interface InsertContext {
  /** The menu item that was chosen. */
  item: MenuItem
  /** Opens the settings panel of the block at a position. */
  openSettings: (pos: number) => void
}

/** Props of a block's React renderer in `<BlockContent>`. */
export interface BlockRenderProps {
  node: JSONNode
  attrs: Record<string, unknown>
  /** The rendered children (text and nested blocks). */
  children?: ReactNode
  /** The block's config, when the content renders with one. */
  block?: BlockConfig
}

/**
 * The JS half of a block: how the editor implements it (TipTap extensions) and
 * how `<BlockContent>` renders it in React. The PHP Block class is the other half.
 */
export interface BlockDefinition {
  /** The node type: the PHP block's `$name`. */
  name: string
  /** TipTap extensions for the node (and its child nodes, like a list's items). */
  extensions?: (context: ExtensionContext) => AnyExtension[]
  /** Menu entries. Default: one from the block's config. Headings offer one per level. */
  menuItems?: (block: BlockConfig, translate: Translate) => MenuItem[]
  /** Inserts the block. Default: a node with the item's attrs (and an empty paragraph for containers). */
  insert?: (editor: Editor, context: InsertContext) => void
  /** Open the settings panel right after inserting (blocks that need a URL first). */
  settingsOnInsert?: boolean
  /** Called after the settings panel changed the block's attributes (columns add or merge columns). */
  afterSettingsChange?: (editor: Editor, pos: number) => void
  /** Renders the block in React. Must produce the same markup as its Blade view. */
  render?: ComponentType<BlockRenderProps>
  /** Plain text of the block, for the React renderer's empty check. */
  isEmpty?: (node: JSONNode) => boolean
}

export type Translate = (key: string, replace?: Record<string, string | number>) => string

interface Registry {
  blocks: Map<string, BlockDefinition>
}

declare global {
  var __javaabuBlockEditor: Registry | undefined
}

/*
 * One registry per page, shared through globalThis: blocks registered by another
 * package's script (or a separately built bundle) reach every editor.
 */
function registry(): Registry {
  globalThis.__javaabuBlockEditor ??= { blocks: new Map() }
  return globalThis.__javaabuBlockEditor
}

/** Types a block definition. */
export function defineBlock(definition: BlockDefinition): BlockDefinition {
  return definition
}

/** Registers blocks for every editor and renderer on the page. A block with the same name is replaced. */
export function registerBlock(...definitions: BlockDefinition[]): void {
  for (const definition of definitions) registry().blocks.set(definition.name, definition)
}

export function forgetBlock(...names: string[]): void {
  for (const name of names) registry().blocks.delete(name)
}

export function getBlock(name: string): BlockDefinition | undefined {
  return registry().blocks.get(name)
}

export function registeredBlocks(): BlockDefinition[] {
  return [...registry().blocks.values()]
}
