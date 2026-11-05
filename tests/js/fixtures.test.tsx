import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BlockContent } from "@javaabu/block-editor/react"
import { canonicalHtml } from "./support/canonical-html"

const dir = join(__dirname, "../Fixtures/content")
const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""))

/*
 * The React renderer must render exactly what the Blade views render: both are
 * compared with the .html files tests/Feature/RenderingFixturesTest.php writes.
 */
describe("BlockContent renders like the Blade views", () => {
  it.each(fixtures)("%s", (name) => {
    const content = readFileSync(join(dir, `${name}.json`), "utf8")
    const expected = readFileSync(join(dir, `${name}.html`), "utf8")
    const markup = renderToStaticMarkup(<BlockContent content={content} />)
    const inner = markup.replace(/^<div class="block-content">/, "").replace(/<\/div>$/, "")
    expect(canonicalHtml(inner)).toBe(expected)
  })
})
