import { createBlockEditor, type BlockEditorOptions } from "@javaabu/block-editor"

export function mount(options: BlockEditorOptions = {}) {
  const host = document.createElement("div")
  document.body.append(host)
  const instance = createBlockEditor(host, options)
  return { host, instance, editor: instance.editor }
}

export function fixture(name: string) {
  return import(`../../Fixtures/content/${name}.json`).then((module: { default: unknown }) => module.default)
}
