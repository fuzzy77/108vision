// tina/config.ts
import { defineConfig } from "tinacms";
var config_default = defineConfig({
  branch: process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "page",
        label: "Service Pages",
        path: "content/pages",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            required: true,
            isTitle: true
          },
          {
            type: "string",
            name: "description",
            label: "Meta Description",
            required: true
          },
          {
            type: "string",
            name: "hero_title",
            label: "Hero Title",
            required: true
          },
          {
            type: "string",
            name: "hero_subtitle",
            label: "Hero Subtitle"
          },
          {
            type: "string",
            name: "cta_text",
            label: "CTA Button Text"
          },
          {
            type: "string",
            name: "cta_link",
            label: "CTA Button Link"
          },
          {
            type: "object",
            name: "sections",
            label: "Page Sections",
            list: true,
            fields: [
              {
                type: "string",
                name: "type",
                label: "Section Type",
                options: ["problem", "solution", "features", "pricing", "faq", "testimonials"]
              },
              {
                type: "string",
                name: "title",
                label: "Section Title"
              },
              {
                type: "rich-text",
                name: "content",
                label: "Section Content"
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true
          }
        ]
      },
      {
        name: "blog",
        label: "Blog Posts",
        path: "content/blog",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            required: true,
            isTitle: true
          },
          {
            type: "datetime",
            name: "date",
            label: "Publication Date",
            required: true
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "cover_image",
            label: "Cover Image"
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true
          }
        ]
      },
      {
        name: "global",
        label: "Global Settings",
        path: "content/global",
        format: "json",
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false
          }
        },
        fields: [
          {
            type: "object",
            name: "nav",
            label: "Navigation",
            fields: [
              {
                type: "object",
                name: "items",
                label: "Nav Items",
                list: true,
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "href", label: "URL" }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              {
                type: "object",
                name: "links",
                label: "Footer Links",
                list: true,
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "href", label: "URL" }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "social",
            label: "Social Links",
            fields: [
              { type: "string", name: "linkedin", label: "LinkedIn URL" },
              { type: "string", name: "github", label: "GitHub URL" },
              { type: "string", name: "twitter", label: "Twitter/X URL" }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
