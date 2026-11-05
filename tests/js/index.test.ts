import { describe, expect, it } from "vitest"
import { VERSION } from "@javaabu/block-editor"

describe("package", () => {
  it("exports its version", () => {
    expect(VERSION).toMatch(/^1\./)
  })
})
