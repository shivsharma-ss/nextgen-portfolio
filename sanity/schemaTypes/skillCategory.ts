/**
 * Purpose: Define the Sanity schema for skill category entries.
 * Main responsibilities: Organize skills by category with custom ordering and drag-and-drop support.
 * Key collaborators: References skill documents for array ordering.
 */
import { defineField, defineType } from "sanity";

export default defineType({
  name: "skillCategory",
  title: "Skill Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Category Name",
      type: "string",
      options: {
        list: [
          { title: "Frontend", value: "frontend" },
          { title: "Backend", value: "backend" },
          { title: "Full-Stack", value: "full-stack" },
          { title: "AI/ML", value: "ai-ml" },
          { title: "DevOps", value: "devops" },
          { title: "Database", value: "database" },
          { title: "Mobile", value: "mobile" },
          { title: "Cloud", value: "cloud" },
          { title: "Testing", value: "testing" },
          { title: "Design", value: "design" },
          { title: "Tools", value: "tools" },
          { title: "Soft Skills", value: "soft-skills" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first in the skills section",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "skills",
      title: "Skills in Category",
      type: "array",
      of: [{ type: "reference", to: [{ type: "skill" }] }],
      description: "Drag and drop to reorder skills within this category",
    }),
  ],
  preview: {
    select: {
      title: "name",
      order: "order",
      skills: "skills",
    },
    /**
     * Purpose: Format the preview listing for skill category documents.
     * Main responsibilities: Build a title with skill count and show order.
     * Inputs/outputs: Receives selection and returns preview metadata.
     */
    prepare({ title, order, skills }) {
      const skillCount = Array.isArray(skills) ? skills.length : 0;
      return {
        title: `${title} (${skillCount} skills)`,
        subtitle: `Order: ${order}`,
      };
    },
  },
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
