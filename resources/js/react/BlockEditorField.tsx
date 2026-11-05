import * as React from "react"
import { useField, useFieldValue, useFormState, type FieldProps } from "@javaabu/forms"

import type { JSONDocument } from "../types"
import { BlockEditor, type BlockEditorProps } from "./BlockEditor"

export interface BlockEditorFieldProps
  extends
    FieldProps,
    Omit<
      BlockEditorProps,
      | "name"
      | "id"
      | "errors"
      | "errorPrefix"
      | "disabled"
      | "aria-label"
      | "aria-labelledby"
      | "aria-describedby"
      | "aria-invalid"
      | "aria-required"
    > {}

const toDot = (name: string) => name.replace(/\[(.*?)\]/g, ".$1").replace(/^\./, "")

/**
 * `<x-block-editor::editor>` for @javaabu/forms: a block editor in a form group with
 * a label, help and validation errors, bound to the form's model and old input.
 * Errors on blocks (`body.content.2.attrs.url`) are shown on the blocks.
 */
export function BlockEditorField({
  name,
  label,
  id,
  model,
  default: fallback,
  required,
  disabled,
  showLabel,
  showErrors,
  inline,
  inlineLabelClass,
  inlineInputClass,
  formGroupClass,
  help,
  onChange,
  ...editor
}: BlockEditorFieldProps) {
  const field = useField({
    name,
    label,
    id,
    required,
    disabled,
    showLabel,
    showErrors,
    inline,
    inlineLabelClass,
    inlineInputClass,
    formGroupClass,
    help,
  })
  const initial = useFieldValue(name, model, fallback) as JSONDocument | string | null | undefined
  const form = useFormState()
  const key = toDot(name)

  const errors = form?.errors
  const blockErrors = React.useMemo(() => {
    if (showErrors === false || !errors) return {}
    return Object.fromEntries(Object.entries(errors).filter(([error]) => error.startsWith(`${key}.`))) as Record<
      string,
      string[] | string
    >
  }, [errors, key, showErrors])

  return field.wrap(
    <BlockEditor
      {...editor}
      name={name}
      id={field.id}
      defaultValue={editor.value === undefined ? (initial ?? null) : undefined}
      disabled={field.disabled}
      errors={blockErrors}
      errorPrefix={key}
      aria-labelledby={`${field.baseId}-label`}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid}
      aria-required={required}
      onChange={(value, instance) => {
        form?.clearErrors(name)
        onChange?.(value, instance)
      }}
    />,
  )
}
