import type { MenuItem, Translate } from "../../registry"
import { h, icon, uid } from "./dom"

/** Filters menu items by the query, against titles, descriptions and keywords. */
export function filterItems(items: MenuItem[], query: string): MenuItem[] {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return items
  return items.filter(
    (item) =>
      item.title.toLocaleLowerCase().includes(q) ||
      (item.description ?? "").toLocaleLowerCase().includes(q) ||
      item.keywords.some((keyword) => keyword.toLocaleLowerCase().startsWith(q)),
  )
}

export interface BlockMenu {
  el: HTMLElement
  /** The search input (only when the menu has one). */
  input: HTMLInputElement | null
  setItems: (items: MenuItem[]) => void
  setQuery: (query: string) => void
  /** Moves the highlight; returns true when there are items. */
  move: (step: number) => boolean
  /** Chooses the highlighted item. */
  choose: () => boolean
  active: () => MenuItem | null
}

/**
 * The list of blocks shown by "/" and by the "+" button: grouped by category,
 * filtered as you type, navigated with the arrow keys (a listbox with an active
 * descendant, so focus stays in the editor or the search box).
 */
export function createBlockMenu(options: {
  t: Translate
  search: boolean
  onChoose: (item: MenuItem) => void
}): BlockMenu {
  const { t } = options
  const listId = uid("be-menu")
  let all: MenuItem[] = []
  let shown: MenuItem[] = []
  let index = 0

  const input = options.search
    ? h("input", {
        type: "search",
        class: "be-menu__search",
        placeholder: t("searchBlocks"),
        "aria-label": t("searchBlocks"),
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": listId,
        "aria-autocomplete": "list",
        dir: "auto",
        autocomplete: "off",
      })
    : null
  const list = h("div", { class: "be-menu__list", role: "listbox", id: listId, "aria-label": t("addBlock") })
  const el = h("div", { class: "be-menu" }, input, list)

  const optionId = (i: number) => `${listId}-${i}`

  const render = () => {
    list.replaceChildren()
    if (shown.length === 0) {
      list.append(h("div", { class: "be-menu__empty", role: "presentation" }, t("noBlocks")))
      input?.removeAttribute("aria-activedescendant")
      return
    }
    const groups = new Map<string, MenuItem[]>()
    for (const item of shown) groups.set(item.category, [...(groups.get(item.category) ?? []), item])
    let i = 0
    for (const [category, items] of groups) {
      const labelId = uid("be-menu-group")
      const group = h(
        "div",
        { role: "group", "aria-labelledby": labelId, class: "be-menu__group" },
        h("div", { id: labelId, class: "be-menu__heading", role: "presentation" }, t(`categories.${category}`)),
      )
      for (const item of items) {
        const position = i
        group.append(
          h(
            "div",
            {
              id: optionId(position),
              role: "option",
              class: "be-menu__item",
              "aria-selected": position === index ? "true" : "false",
              "data-block": item.block,
              onpointerdown: (event: Event) => event.preventDefault(),
              onclick: () => options.onChoose(item),
              onpointermove: () => highlight(position),
            },
            h("span", { class: "be-menu__icon" }, icon(item.icon)),
            h(
              "span",
              { class: "be-menu__text" },
              h("span", { class: "be-menu__title" }, item.title),
              item.description ? h("span", { class: "be-menu__description" }, item.description) : null,
            ),
          ),
        )
        i += 1
      }
      list.append(group)
    }
    input?.setAttribute("aria-activedescendant", optionId(index))
  }

  const highlight = (next: number) => {
    if (next === index) return
    list.querySelector(`#${CSS.escape(optionId(index))}`)?.setAttribute("aria-selected", "false")
    index = next
    const option = list.querySelector(`#${CSS.escape(optionId(index))}`)
    option?.setAttribute("aria-selected", "true")
    option?.scrollIntoView?.({ block: "nearest" })
    input?.setAttribute("aria-activedescendant", optionId(index))
  }

  const menu: BlockMenu = {
    el,
    input,
    setItems(items) {
      all = items
      shown = items
      index = 0
      render()
    },
    setQuery(query) {
      shown = filterItems(all, query)
      index = 0
      render()
    },
    move(step) {
      if (shown.length === 0) return false
      highlight((index + step + shown.length) % shown.length)
      return true
    },
    choose() {
      const item = shown[index]
      if (!item) return false
      options.onChoose(item)
      return true
    },
    active: () => shown[index] ?? null,
  }

  input?.addEventListener("input", () => menu.setQuery(input.value))
  input?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      menu.move(event.key === "ArrowDown" ? 1 : -1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      menu.choose()
    }
  })

  return menu
}
