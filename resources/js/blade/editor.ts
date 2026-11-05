/**
 * The Blade entry (`block-editor::editor`): mounts an editor on every
 * `[data-block-editor]` on the page, as rendered by `<x-block-editor::editor>`:
 *
 *   <div data-block-editor data-config="{…}" data-errors="{…}" data-error-prefix="body">
 *     <input type="hidden" name="body" value="{…}">
 *   </div>
 *
 * The hidden input carries the JSON for the form post and is kept in sync.
 * Editors added later (Turbo, modals) mount with `mountBlockEditors(root)`.
 */
import "../../css/block-editor.css"
import { createBlockEditor, type BlockEditorInstance } from "../index"
import type { ContentErrors } from "../types"

const instances = new WeakMap<HTMLElement, BlockEditorInstance>()

function readJson<T>(value: string | undefined): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

/** Mounts one editor. Returns the existing instance when it's already mounted. */
export function mountBlockEditor(element: HTMLElement): BlockEditorInstance {
  const existing = instances.get(element)
  if (existing) return existing

  const input = element.querySelector<HTMLInputElement>(
    "input[type=hidden][data-block-editor-input], input[type=hidden]",
  )
  const { dataset } = element
  const attributes: Record<string, string | undefined> = {
    id: dataset.inputId,
    "aria-labelledby": dataset.labelledby,
    "aria-describedby": dataset.describedby,
    "aria-invalid": dataset.invalid === undefined ? undefined : "true",
    "aria-required": dataset.required === undefined ? undefined : "true",
  }

  const instance = createBlockEditor(element, {
    config: dataset.config,
    content: input?.value ?? null,
    editable: dataset.readonly === undefined && dataset.disabled === undefined,
    thaana: dataset.thaana === "false" ? false : undefined,
    errors: readJson<ContentErrors>(dataset.errors),
    errorPrefix: dataset.errorPrefix ?? "",
    attributes,
    onChange: (value) => {
      if (!input) return
      input.value = JSON.stringify(value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    },
  })
  if (input) input.value = JSON.stringify(instance.getJSON())

  instances.set(element, instance)
  element.dispatchEvent(new CustomEvent("block-editor:ready", { bubbles: true, detail: instance }))
  return instance
}

/** Mounts every editor under a root (default: the document) that isn't mounted yet. */
export function mountBlockEditors(root: ParentNode = document): BlockEditorInstance[] {
  return [...root.querySelectorAll<HTMLElement>("[data-block-editor]")].map(mountBlockEditor)
}

export function getBlockEditor(element: HTMLElement): BlockEditorInstance | undefined {
  return instances.get(element)
}

declare global {
  interface Window {
    JavaabuBlockEditor?: {
      mount: typeof mountBlockEditor
      mountAll: typeof mountBlockEditors
      get: typeof getBlockEditor
    }
  }
}

if (typeof window !== "undefined") {
  window.JavaabuBlockEditor = { mount: mountBlockEditor, mountAll: mountBlockEditors, get: getBlockEditor }

  // Block scripts of other packages are module scripts too, so they've run by DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountBlockEditors(), { once: true })
  } else {
    queueMicrotask(() => mountBlockEditors())
  }
}
