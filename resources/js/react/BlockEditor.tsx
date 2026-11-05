import * as React from "react"

import { createBlockEditor, type BlockEditorInstance, type BlockEditorOptions } from "../editor/create"
import type { ContentErrors, EditorConfig, JSONDocument } from "../types"

export interface BlockEditorProps extends Pick<
  BlockEditorOptions,
  "thaana" | "toolbar" | "extensions" | "autofocus" | "locale" | "errorPrefix"
> {
  /** The editor config from PHP (`BlockEditor::editorConfig()`), as a prop. */
  config?: EditorConfig | string | null
  /** Controlled content. */
  value?: JSONDocument | string | null
  /** Starting content when uncontrolled. */
  defaultValue?: JSONDocument | string | null
  onChange?: (value: JSONDocument, instance: BlockEditorInstance) => void
  /** Name of a hidden input with the JSON, for plain form posts. */
  name?: string
  readOnly?: boolean
  disabled?: boolean
  /** Errors to show on blocks, keyed by JSON path (`content.2.attrs.url`) or with `errorPrefix`. */
  errors?: ContentErrors | null
  id?: string
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  "aria-required"?: boolean | "true" | "false"
  /** Receives the editor instance (TipTap editor, getJSON, setContent, …). */
  onReady?: (instance: BlockEditorInstance) => void
}

const serialize = (value: JSONDocument | string | null | undefined) =>
  typeof value === "string" ? value : value ? JSON.stringify(value) : ""

/**
 * The block editor as a React component: the same editor as the Blade field,
 * mounted into a div. Works controlled (`value` + `onChange`) or uncontrolled.
 */
export function BlockEditor({
  config,
  value,
  defaultValue,
  onChange,
  name,
  readOnly,
  disabled,
  errors,
  errorPrefix,
  id,
  className,
  onReady,
  thaana,
  toolbar,
  extensions,
  autofocus,
  locale,
  ...aria
}: BlockEditorProps) {
  const host = React.useRef<HTMLDivElement>(null)
  const instance = React.useRef<BlockEditorInstance | null>(null)
  const [json, setJson] = React.useState(() => serialize(value ?? defaultValue))
  const latest = React.useRef({ onChange, onReady })
  React.useEffect(() => {
    latest.current = { onChange, onReady }
  })

  const configKey = typeof config === "string" ? config : JSON.stringify(config ?? null)
  const thaanaKey = JSON.stringify(thaana ?? null)
  const attributes = {
    id,
    "aria-label": aria["aria-label"],
    "aria-labelledby": aria["aria-labelledby"],
    "aria-describedby": aria["aria-describedby"],
    "aria-invalid": aria["aria-invalid"] === true || aria["aria-invalid"] === "true" ? "true" : undefined,
    "aria-required": aria["aria-required"] === true || aria["aria-required"] === "true" ? "true" : undefined,
  }
  const attributesKey = JSON.stringify(attributes)

  React.useEffect(() => {
    if (!host.current) return
    const created = createBlockEditor(host.current, {
      config: configKey === "null" ? null : (JSON.parse(configKey) as EditorConfig | string),
      content: value ?? defaultValue ?? null,
      editable: !readOnly && !disabled,
      thaana,
      toolbar,
      extensions,
      autofocus,
      locale,
      errorPrefix,
      attributes: JSON.parse(attributesKey) as Record<string, string | undefined>,
      onChange: (next) => {
        setJson(JSON.stringify(next))
        latest.current.onChange?.(next, created)
      },
    })
    instance.current = created
    setJson(JSON.stringify(created.getJSON()))
    latest.current.onReady?.(created)
    return () => {
      created.destroy()
      instance.current = null
    }
    // Recreated when the schema changes; content, errors and editable sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, thaanaKey, toolbar, locale, attributesKey])

  // Controlled value: replace the content when it differs from the editor's.
  React.useEffect(() => {
    const current = instance.current
    if (!current || value === undefined) return
    const next = serialize(value)
    if (next === JSON.stringify(current.getJSON())) return
    current.setContent(value)
  }, [value])

  React.useEffect(() => {
    instance.current?.setEditable(!readOnly && !disabled)
  }, [readOnly, disabled, configKey])

  React.useEffect(() => {
    instance.current?.setErrors(errors ?? {}, errorPrefix ?? "")
  }, [errors, errorPrefix, configKey])

  return (
    <div className={className} data-slot="block-editor" data-disabled={disabled || undefined}>
      <div ref={host} />
      {name ? <input type="hidden" name={name} value={json} /> : null}
    </div>
  )
}
