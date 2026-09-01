import { z } from "zod";

export const confirmDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must have at least 2 characters."),
  categoryId: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    },
    z.string().optional(),
  ),
  categoryName: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    },
    z.string().optional(),
  ),
  summary: z
    .string()
    .trim()
    .min(10, "Summary must have at least 10 characters."),
  // Optional AI-extracted metadata (user-editable)
  documentOwner: z.string().trim().optional(),
  author: z.string().trim().optional(),
  documentType: z.string().trim().optional(),
  concerning: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  documentDate: z.string().trim().optional(),
});

export type ConfirmDocumentFormData = z.infer<typeof confirmDocumentSchema>;

export const manualConfirmDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must have at least 2 characters."),
  folderId: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    },
    z.string().optional(),
  ),
});

export type ManualConfirmDocumentFormData = z.infer<
  typeof manualConfirmDocumentSchema
>;
