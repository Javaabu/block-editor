import { act, render, screen } from "@testing-library/react"
import { Form } from "@javaabu/forms"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import { defaultConfig, registerBlock, defineBlock, forgetBlock, type JSONDocument } from "@javaabu/block-editor"
import { BlockContent, BlockEditor, BlockEditorField, StencilBlockEditor } from "@javaabu/block-editor/react"

const doc = (text: string): JSONDocument => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
})

describe("BlockEditor", () => {
  it("mounts the editor and keeps a hidden input in sync", async () => {
    const onChange = vi.fn()
    const { container } = render(
      <BlockEditor name="body" defaultValue={doc("ދިވެހި")} onChange={onChange} aria-label="Body" />,
    )
    const input = container.querySelector<HTMLInputElement>('input[name="body"]')!
    expect(JSON.parse(input.value).content[0].content[0].text).toBe("ދިވެހި")
    expect(screen.getByRole("textbox", { name: "Body" })).toBeInTheDocument()

    const instance = await new Promise<import("@javaabu/block-editor").BlockEditorInstance>((resolve) => {
      render(<BlockEditor onReady={resolve} />)
    })
    expect(instance.getJSON().type).toBe("doc")
  })

  it("follows a controlled value", () => {
    let instance: import("@javaabu/block-editor").BlockEditorInstance | null = null
    const { rerender } = render(<BlockEditor value={doc("one")} onReady={(i) => (instance = i)} />)
    expect(instance!.editor.getText()).toBe("one")
    rerender(<BlockEditor value={doc("two")} onReady={(i) => (instance = i)} />)
    expect(instance!.editor.getText()).toBe("two")
  })

  it("can be read only and shows errors", () => {
    let instance: import("@javaabu/block-editor").BlockEditorInstance | null = null
    const { container } = render(
      <BlockEditor readOnly value={doc("x")} errors={{ "content.0": ["ހުސް"] }} onReady={(i) => (instance = i)} />,
    )
    expect(instance!.editor.isEditable).toBe(false)
    expect(container.querySelector(".be-block-error")).toHaveTextContent("ހުސް")
  })
})

describe("BlockEditorField", () => {
  it("binds to the form model, labels the editor and shows block errors", () => {
    const { container } = render(
      <Form
        model={{ body: doc("މޮޑެލް") }}
        errors={{ body: ["ބްލޮކް 1: ކުށެއް"], "body.content.0": ["ކުށެއް"] }}
        csrf={false}
      >
        <BlockEditorField name="body" label="ކޮންޓެންޓް" required help="ބްލޮކްތައް ލިޔުއްވާ" />
      </Form>,
    )
    const editor = screen.getByRole("textbox", { name: /ކޮންޓެންޓް/ })
    expect(editor).toHaveAttribute("aria-invalid", "true")
    expect(editor).toHaveAttribute("aria-required", "true")
    expect(editor.getAttribute("aria-describedby")).toMatch(/help/)
    expect(screen.getByText("ބްލޮކް 1: ކުށެއް")).toBeInTheDocument()
    expect(container.querySelector(".be-block-error")).toHaveTextContent("ކުށެއް")
    expect(
      JSON.parse(container.querySelector<HTMLInputElement>('input[name="body"]')!.value).content[0].content[0].text,
    ).toBe("މޮޑެލް")
  })

  it("renders as the stencil block-editor type", () => {
    render(
      <Form csrf={false}>
        <StencilBlockEditor
          node={{ key: "body", name: "body", props: { label: "Body", config: defaultConfig("dv") } }}
        />
      </Form>,
    )
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "ފޯމެޓިންގ")
  })
})

describe("BlockContent", () => {
  it("shows the empty slot without content", () => {
    render(<BlockContent content={null} empty={<p>ނެތް</p>} />)
    expect(screen.getByText("ނެތް")).toBeInTheDocument()
    render(<BlockContent content={{ type: "doc", content: [{ type: "paragraph" }] }} empty="empty" />)
    expect(screen.getByText("empty")).toBeInTheDocument()
  })

  it("renders server HTML when given", () => {
    const { container } = render(<BlockContent html='<p dir="auto">server</p>' className="prose" />)
    expect(container.firstElementChild).toHaveClass("block-content", "prose")
    expect(container).toHaveTextContent("server")
  })

  it("uses registered and passed renderers for custom blocks", () => {
    registerBlock(
      defineBlock({
        name: "alert",
        render: ({ attrs, children }) => <aside data-tone={String(attrs.tone)}>{children}</aside>,
      }),
    )
    const content: JSONDocument = {
      type: "doc",
      content: [
        { type: "alert", attrs: { tone: "loud" }, content: [{ type: "text", text: "ހޭލާ" }] },
        { type: "unknownThing", content: [{ type: "paragraph", content: [{ type: "text", text: "kept" }] }] },
      ],
    }
    const { container, rerender } = render(<BlockContent content={content} />)
    expect(container.querySelector('aside[data-tone="loud"]')).toHaveTextContent("ހޭލާ")
    expect(container.querySelector('[data-block="unknownThing"]')).toHaveTextContent("kept")

    rerender(<BlockContent content={content} renderers={{ alert: () => <b>override</b> }} />)
    expect(container.querySelector("b")).toHaveTextContent("override")
    forgetBlock("alert")
  })

  it("drops unsafe links, images and buttons and cleans HTML blocks", () => {
    const content: JSONDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
        },
        { type: "image", attrs: { src: "javascript:alert(1)" } },
        { type: "button", attrs: { text: "x", url: "javascript:alert(1)" } },
        { type: "html", attrs: { html: '<p onclick="x()">ok<script>bad()</script><a href="javascript:x">l</a></p>' } },
      ],
    }
    const { container } = render(<BlockContent content={content} />)
    expect(container.querySelector("a[href^='javascript']")).toBeNull()
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector(".block-button")).toBeNull()
    expect(container.querySelector(".block-html")!.innerHTML).toBe("<p>ok<a>l</a></p>")
  })
})

describe("the Blade entry", () => {
  it("mounts [data-block-editor] with its config, label, errors and hidden input", async () => {
    document.body.innerHTML = `
      <div data-block-editor data-config='${JSON.stringify(defaultConfig("dv")).replace(/'/g, "&#39;")}'
           data-input-id="body" data-label="ކޮންޓެންޓް" data-error-prefix="body"
           data-errors='{"body.content.0":["ކުށެއް"]}' data-required>
        <input type="hidden" name="body" value='${JSON.stringify(doc("ދިވެހި"))}'>
      </div>`
    const { mountBlockEditors, getBlockEditor } = await import("../../resources/js/blade/editor")
    await act(async () => {
      mountBlockEditors()
    })
    const element = document.querySelector<HTMLElement>("[data-block-editor]")!
    const instance = getBlockEditor(element)!
    expect(instance.editor.getText()).toBe("ދިވެހި")
    expect(screen.getByRole("textbox", { name: "ކޮންޓެންޓް" })).toHaveAttribute("id", "body")
    expect(element.querySelector(".be-block-error")).toHaveTextContent("ކުށެއް")
    expect(mountBlockEditors()[0]).toBe(instance)

    instance.editor.commands.setContent(doc("އައު"), { emitUpdate: true })
    expect(
      JSON.parse(element.querySelector<HTMLInputElement>('input[name="body"]')!.value).content[0].content[0].text,
    ).toBe("އައު")
    expect(window.JavaabuBlockEditor?.get(element)).toBe(instance)
  })
})

void React
