import { beforeEach, describe, expect, it, vi } from "vitest"

// Inertia pages get no manifest tags, so the React components import the stylesheet for Vite to bundle.
const loaded = { count: 0 }

describe("the React components' stylesheet", () => {
  beforeEach(() => {
    vi.resetModules()
    loaded.count = 0
    vi.doMock("../../resources/js/block-editor.css", () => {
      loaded.count++
      return {}
    })
  })

  it.each([
    ["BlockEditor", () => import("../../resources/js/react/BlockEditor")],
    ["BlockContent", () => import("../../resources/js/react/BlockContent")],
    ["BlockEditorField", () => import("../../resources/js/react/BlockEditorField")],
    ["StencilBlockEditor", () => import("../../resources/js/react/stencil")],
  ])("is imported with %s", async (_, load) => {
    await load()
    expect(loaded.count).toBe(1)
  })

  it("is not imported by the Blade entry, which manifest gives the stylesheet", async () => {
    await import("../../resources/js/blade/editor")
    expect(loaded.count).toBe(0)
  })
})
