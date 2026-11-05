import { describe, expect, it } from "vitest"

import {
  detectDirection,
  directionOf,
  forgetEmbedProvider,
  isSafeImageUrl,
  isSafeUrl,
  registerEmbedProvider,
  toEmbedUrl,
  translator,
  parseContent,
  isEmptyDocument,
} from "@javaabu/block-editor"
import { cleanHtml } from "../../resources/js/html"
import { errorPath } from "../../resources/js/editor/errors"
import { filterItems } from "../../resources/js/editor/ui/block-menu"

describe("urls", () => {
  it("matches the PHP checks", () => {
    for (const url of [
      "https://javaabu.com",
      "mailto:a@b.mv",
      "tel:+960",
      "/about",
      "#top",
      "?a=1",
      "//cdn.example.com/x",
    ]) {
      expect(isSafeUrl(url), url).toBe(true)
    }
    for (const url of ["javascript:alert(1)", "java\tscript:x", " JAVASCRIPT:x", "data:text/html,x", "", null, 3]) {
      expect(isSafeUrl(url), String(url)).toBe(false)
    }
    expect(isSafeImageUrl("https://example.com/a.png")).toBe(true)
    expect(isSafeImageUrl("mailto:a@b.c")).toBe(false)
  })
})

describe("embeds", () => {
  it("frames YouTube and Vimeo links only", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    )
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    expect(toEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    )
    expect(toEmbedUrl("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871")
    expect(toEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull()
    expect(toEmbedUrl("javascript:alert(1)")).toBeNull()
    expect(toEmbedUrl("not a url")).toBeNull()
    expect(toEmbedUrl(null)).toBeNull()
  })

  it("takes custom providers", () => {
    registerEmbedProvider("loom", (url) =>
      url.startsWith("https://www.loom.com/share/") ? url.replace("/share/", "/embed/") : null,
    )
    expect(toEmbedUrl("https://www.loom.com/share/abc")).toBe("https://www.loom.com/embed/abc")
    forgetEmbedProvider("loom")
    expect(toEmbedUrl("https://www.loom.com/share/abc")).toBeNull()
  })
})

describe("direction", () => {
  it("resolves like the PHP renderer", () => {
    expect(detectDirection("ދިވެހި")).toBe("rtl")
    expect(detectDirection("123 English")).toBe("ltr")
    expect(detectDirection("123 !")).toBeNull()
    const list = {
      type: "bulletList",
      content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "ދިވެހި" }] }] }],
    }
    expect(directionOf(list)).toBe("rtl")
    expect(directionOf({ type: "paragraph", content: [{ type: "text", text: "ދިވެހި" }] })).toBe("auto")
    expect(directionOf({ type: "blockquote", attrs: { dir: "ltr" } })).toBe("ltr")
    expect(
      directionOf({ type: "blockquote", content: [{ type: "codeBlock", content: [{ type: "text", text: "x" }] }] }),
    ).toBe("auto")
  })
})

describe("strings", () => {
  it("translates with replacements and falls back", () => {
    const t = translator({ hello: "ހެލޯ :name", categories: { text: "ލިޔުން" } }, { bye: "Bye" })
    expect(t("hello", { name: "ޢަލީ" })).toBe("ހެލޯ ޢަލީ")
    expect(t("categories.text")).toBe("ލިޔުން")
    expect(t("bye")).toBe("Bye")
    expect(t("missing")).toBe("missing")
  })
})

describe("content", () => {
  it("parses and checks for emptiness", () => {
    expect(parseContent('{"type":"doc","content":[]}')).toEqual({ type: "doc", content: [] })
    expect(parseContent('{"type":"paragraph"}')).toBeNull()
    expect(parseContent("nope")).toBeNull()
    expect(parseContent("  ")).toBeNull()
    expect(isEmptyDocument({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true)
    expect(isEmptyDocument({ type: "doc", content: [{ type: "horizontalRule" }] })).toBe(false)
  })

  it("reads error paths", () => {
    expect(errorPath("content.2.attrs.url")).toEqual([2])
    expect(errorPath("content.1.content.0.content.3.marks.0")).toEqual([1, 0, 3])
    expect(errorPath("content")).toBeNull()
  })

  it("cleans HTML", () => {
    expect(
      cleanHtml('<p style="color:red" onmouseover="x()">a<iframe src="x"></iframe><img src="javascript:x"></p>'),
    ).toBe("<p>a<img></p>")
  })

  it("filters menu items by title, description and keyword", () => {
    const items = [
      { id: "a", block: "a", title: "ސުރުޚީ", description: "Heading", icon: "x", keywords: ["h1"], category: "text" },
      { id: "b", block: "b", title: "Image", icon: "x", keywords: ["photo"], category: "media" },
    ]
    expect(filterItems(items, "ސުރު").map((i) => i.id)).toEqual(["a"])
    expect(filterItems(items, "head").map((i) => i.id)).toEqual(["a"])
    expect(filterItems(items, "pho").map((i) => i.id)).toEqual(["b"])
    expect(filterItems(items, " ").length).toBe(2)
  })
})

describe("menu ranking", () => {
  it("puts title matches before keyword matches", () => {
    const items = [
      { id: "table", block: "table", title: "Table", icon: "x", keywords: ["columns"], category: "text" },
      { id: "columns", block: "columns", title: "Columns", icon: "x", keywords: [], category: "layout" },
    ]
    expect(filterItems(items, "col").map((i) => i.id)).toEqual(["columns", "table"])
  })
})
