import type { Translate } from "./registry"
import type { EditorStrings } from "./types"

/** A translator over the editor strings: `t("categories.text")`, `t("headingLevel", { level: 2 })`. */
export function translator(strings: EditorStrings, fallback: EditorStrings = {}): Translate {
  const read = (source: EditorStrings, key: string): string | undefined => {
    const [head, ...rest] = key.split(".")
    const value = source[head!]
    if (rest.length === 0) return typeof value === "string" ? value : undefined
    return value && typeof value === "object" ? value[rest.join(".")] : undefined
  }

  return (key, replace = {}) => {
    let line = read(strings, key) ?? read(fallback, key) ?? key
    for (const [name, value] of Object.entries(replace)) line = line.split(`:${name}`).join(String(value))
    return line
  }
}
