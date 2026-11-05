import type { EditorConfig } from "../types"
import { BlockEditorField } from "./BlockEditorField"

/** What javaabu/stencil's React renderer passes a field component (StencilComponentProps). */
export interface StencilBlockEditorProps {
  node: {
    key: string
    name?: string
    props?: Record<string, unknown>
  }
}

/**
 * The `block-editor` field type of javaabu/stencil. Register it next to the other
 * components: `<StencilProvider components={{ "block-editor": StencilBlockEditor }}>`.
 */
export function StencilBlockEditor({ node }: StencilBlockEditorProps) {
  const { config, label, required, help, inline, showLabel, disabled, thaana, toolbar } = (node.props ?? {}) as {
    config?: EditorConfig
    label?: string
    required?: boolean
    help?: string
    inline?: boolean
    showLabel?: boolean
    disabled?: boolean
    thaana?: boolean
    toolbar?: boolean
  }

  return (
    <BlockEditorField
      name={node.name ?? node.key}
      config={config}
      label={label}
      required={required}
      help={help}
      inline={inline}
      showLabel={showLabel}
      disabled={disabled}
      thaana={thaana}
      toolbar={toolbar}
    />
  )
}
