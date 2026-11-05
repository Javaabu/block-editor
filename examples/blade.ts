import "../resources/css/block-editor.css"
import { defaultConfig } from "@javaabu/block-editor"
import { getBlockEditor, mountBlockEditors } from "@javaabu/block-editor/blade/editor"

import { sample } from "./sample"

const element = document.getElementById("editor")!
const input = element.querySelector<HTMLInputElement>("input")!
const output = document.getElementById("json")!
const locale = new URLSearchParams(location.search).get("locale") === "dv" ? "dv" : "en"

if (locale === "dv") {
  document.documentElement.lang = "dv"
  document.documentElement.dir = "rtl"
}

element.dataset.config = JSON.stringify(defaultConfig(locale))
input.value = JSON.stringify(sample)
input.addEventListener("input", () => (output.textContent = JSON.stringify(JSON.parse(input.value), null, 2)))

mountBlockEditors()
output.textContent = JSON.stringify(getBlockEditor(element)?.getJSON(), null, 2)

document.getElementById("direction")!.addEventListener("click", () => {
  location.search = locale === "dv" ? "" : "?locale=dv"
})
