import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
  document.body.innerHTML = ""
})

// jsdom has no layout: ProseMirror and the popovers measure ranges and elements.
const rect = () => new DOMRect(0, 0, 0, 0)
const rects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
Range.prototype.getBoundingClientRect = rect
Range.prototype.getClientRects = rects
Element.prototype.scrollIntoView ??= () => undefined
document.elementFromPoint ??= () => null
