import type { JSONDocument } from "@javaabu/block-editor"

/** Mixed Dhivehi and English content with every core block. */
export const sample: JSONDocument = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "ބްލޮކް އެޑިޓަރު" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Type " },
        { type: "text", text: "/", marks: [{ type: "code" }] },
        { type: "text", text: " for blocks. ތާނައިން ލިޔުއްވުމަށް " },
        { type: "text", text: "Alt+Shift+T", marks: [{ type: "bold" }] },
        { type: "text", text: " ފިތާލައްވާ." },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "ފުރަތަމަ ކަންތަށް" }] }] },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "English inside a Dhivehi list" }] }],
        },
      ],
    },
    {
      type: "columns",
      attrs: { layout: "2-1", stackAt: "md", gap: "md", verticalAlign: "stretch" },
      content: [
        {
          type: "column",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "ކޮލަމްތައް" }] },
            { type: "paragraph", content: [{ type: "text", text: "ބޮޑު ކޮލަމް. Columns follow the text direction." }] },
          ],
        },
        {
          type: "column",
          content: [
            {
              type: "callout",
              attrs: { variant: "info" },
              content: [{ type: "text", text: "ކުޑަ ކޮލަމުގައި ނޯޓެއް" }],
            },
          ],
        },
      ],
    },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "ޤައުލެއް. A quote." }] }] },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "ނަން" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Name" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "މާލެ" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Malé" }] }] },
          ],
        },
      ],
    },
    {
      type: "button",
      attrs: { text: "ގިނައިން", url: "https://javaabu.com", variant: "primary", newTab: false, align: "start" },
    },
    { type: "codeBlock", attrs: { language: "php" }, content: [{ type: "text", text: "$post->body->render();" }] },
  ],
}
