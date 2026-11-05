import { h } from "./dom"

export interface Popover {
  el: HTMLElement
  /** Shows the popover under (or above, when there's no room) a rectangle. */
  open: (anchor: () => DOMRect | null) => void
  /** Moves it after the anchor moved. */
  reposition: () => void
  close: (reason?: "escape" | "outside" | "action") => void
  isOpen: () => boolean
  destroy: () => void
}

export interface PopoverOptions {
  className: string
  /** The editor wrapper: its direction aligns the popover, and clicks inside it don't count as outside. */
  root: HTMLElement
  rtl: () => boolean
  role?: string
  label?: string
  onClose?: (reason: "escape" | "outside" | "action") => void
  /** Extra elements that don't close the popover when clicked (the button that opened it). */
  ignore?: () => (Element | null)[]
}

/**
 * A floating panel in a layer on the body (position: fixed), aligned to the inline
 * start of its anchor, closed by Escape and by pressing outside.
 */
export function createPopover(options: PopoverOptions): Popover {
  const el = h("div", {
    class: `be-popover ${options.className}`,
    role: options.role,
    "aria-label": options.label,
    hidden: true,
  })
  let anchor: (() => DOMRect | null) | null = null

  const position = () => {
    const rect = anchor?.()
    if (!rect) return
    const rtl = options.rtl()
    el.setAttribute("dir", rtl ? "rtl" : "ltr")
    const view = el.ownerDocument.defaultView ?? window
    const width = el.offsetWidth
    const height = el.offsetHeight
    const below = rect.bottom + 6
    const top = below + height > view.innerHeight && rect.top - height - 6 > 0 ? rect.top - height - 6 : below
    let left = rtl ? rect.right - width : rect.left
    left = Math.max(8, Math.min(left, view.innerWidth - width - 8))
    el.style.top = `${Math.round(top)}px`
    el.style.left = `${Math.round(left)}px`
  }

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null
    if (!target || el.contains(target)) return
    if (options.ignore?.().some((element) => element?.contains(target))) return
    popover.close("outside")
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    event.stopPropagation()
    popover.close("escape")
  }

  const popover: Popover = {
    el,
    open(next) {
      anchor = next
      if (!el.isConnected) el.ownerDocument.body.append(el)
      el.hidden = false
      position()
      el.ownerDocument.addEventListener("pointerdown", onPointerDown, true)
      el.addEventListener("keydown", onKeyDown)
      window.addEventListener("resize", position)
      window.addEventListener("scroll", position, true)
    },
    reposition: position,
    close(reason = "action") {
      if (el.hidden) return
      el.hidden = true
      el.ownerDocument.removeEventListener("pointerdown", onPointerDown, true)
      el.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", position)
      window.removeEventListener("scroll", position, true)
      options.onClose?.(reason)
    },
    isOpen: () => !el.hidden,
    destroy() {
      popover.close()
      el.remove()
    },
  }

  return popover
}
