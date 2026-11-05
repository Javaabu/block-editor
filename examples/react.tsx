import "../resources/css/block-editor.css"
import { Form, Submit } from "@javaabu/forms"
import * as React from "react"
import { createRoot } from "react-dom/client"

import { defaultConfig, type JSONDocument } from "@javaabu/block-editor"
import { BlockContent, BlockEditorField } from "@javaabu/block-editor/react"

import { sample } from "./sample"

function App() {
  const [locale, setLocale] = React.useState<"en" | "dv">("en")
  const [content, setContent] = React.useState<JSONDocument>(sample)
  const [submitted, setSubmitted] = React.useState<unknown>(null)
  const config = React.useMemo(() => defaultConfig(locale), [locale])
  const errors = {
    body: ["Block 7 (Button): Use an http(s), mailto or tel link."],
    "body.content.6.attrs.url": ["Use an http(s), mailto or tel link."],
  }

  return (
    <main dir={locale === "dv" ? "rtl" : "ltr"} lang={locale}>
      <header>
        <h1>React</h1>
        <p>
          <a href="./index.html">Blade entry</a> ·{" "}
          <button type="button" onClick={() => setLocale(locale === "dv" ? "en" : "dv")}>
            {locale === "dv" ? "English" : "ދިވެހި"}
          </button>
        </p>
      </header>
      <div className="panels">
        <Form model={{ body: sample }} errors={errors} csrf={false} onSubmit={(values) => setSubmitted(values)}>
          <BlockEditorField
            key={locale}
            name="body"
            label={locale === "dv" ? "ކޮންޓެންޓް" : "Body"}
            config={config}
            onChange={setContent}
            required
          />
          <Submit>{locale === "dv" ? "ސޭވްކުރައްވާ" : "Save"}</Submit>
        </Form>
        <section>
          <h2>BlockContent</h2>
          <BlockContent content={content} config={config} />
          {submitted ? (
            <pre className="json" dir="ltr">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          ) : null}
        </section>
      </div>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
