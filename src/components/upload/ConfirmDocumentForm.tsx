"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetCategories } from "@/lib/hooks/useCategories";
import { useGetRootFolders } from "@/lib/hooks/useFolders";
import {
  confirmDocumentSchema,
  manualConfirmDocumentSchema,
  type ConfirmDocumentFormData,
  type ManualConfirmDocumentFormData,
} from "@/types/schema/document.schema";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ProcessDocumentResult, UploadProcessingMode } from "@/types/document";

interface ConfirmDocumentFormProps {
  mode: UploadProcessingMode;
  defaultValues: ProcessDocumentResult;
  defaultFolderId?: string | null;
  onConfirm: (data: ConfirmDocumentFormData | ManualConfirmDocumentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ConfirmDocumentForm({
  mode,
  defaultValues,
  defaultFolderId,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDocumentFormProps) {
  const { categories } = useGetCategories();
  const { folders, isLoading: foldersLoading } = useGetRootFolders();
  const folderId = defaultFolderId ?? "";

  const predictedCategoryId = categories.find(
    (category) =>
      category.name.toLowerCase() === defaultValues.category?.toLowerCase(),
  )?.id;

  const initialCategoryId = predictedCategoryId ?? "";
  const predictedCategoryName =
    categories.find((category) => category.id === predictedCategoryId)?.name ||
    defaultValues.category?.trim() ||
    "";

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const [categoryDropdownWidth, setCategoryDropdownWidth] = useState<number | null>(null);

  const aiForm = useForm<ConfirmDocumentFormData>({
    resolver: zodResolver(confirmDocumentSchema) as any,
    defaultValues: {
      title: defaultValues.title,
      categoryId: initialCategoryId,
      categoryName: predictedCategoryName || defaultValues.category || undefined,
      summary: defaultValues.summary,
      documentOwner: defaultValues.documentOwner ?? undefined,
      author: defaultValues.author ?? undefined,
      documentType: defaultValues.documentType ?? undefined,
      concerning: defaultValues.concerning ?? undefined,
      purpose: defaultValues.purpose ?? undefined,
      documentDate: defaultValues.documentDate ?? undefined,
    },
  });

  const manualForm = useForm<ManualConfirmDocumentFormData>({
    resolver: zodResolver(manualConfirmDocumentSchema) as any,
    defaultValues: {
      title: defaultValues.title,
      folderId: folderId || undefined,
    },
  });

  const categoryName = aiForm.watch("categoryName") ?? "";
  const categoryId = aiForm.watch("categoryId");

  const filteredCategories = useMemo(() => {
    const query = categoryName.trim().toLowerCase();
    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query),
    );
  }, [categories, categoryName]);

  const canCreateCategory =
    categoryName.trim().length > 0 &&
    !categories.some(
      (category) =>
        category.name.toLowerCase() === categoryName.trim().toLowerCase(),
    );

  useEffect(() => {
    const updateWidth = () => {
      if (categoryDropdownRef.current) {
        setCategoryDropdownWidth(
          categoryDropdownRef.current.getBoundingClientRect().width,
        );
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (mode === "manual") {
      manualForm.reset({
        title: defaultValues.title,
        folderId: folderId || undefined,
      });
      return;
    }

    aiForm.reset({
      title: defaultValues.title,
      categoryId: initialCategoryId,
      categoryName: predictedCategoryName || defaultValues.category || undefined,
      summary: defaultValues.summary,
      documentOwner: defaultValues.documentOwner ?? undefined,
      author: defaultValues.author ?? undefined,
      documentType: defaultValues.documentType ?? undefined,
      concerning: defaultValues.concerning ?? undefined,
      purpose: defaultValues.purpose ?? undefined,
      documentDate: defaultValues.documentDate ?? undefined,
    });
  }, [
    aiForm,
    defaultValues,
    folderId,
    initialCategoryId,
    manualForm,
    mode,
    predictedCategoryName,
  ]);

  if (mode === "manual") {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = manualForm;

    return (
      <form
        onSubmit={handleSubmit(onConfirm)}
        className="grid gap-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none"
            placeholder="Document title"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="folderId" className="block text-sm font-medium text-foreground">
            Folder
          </label>
          <select
            id="folderId"
            {...register("folderId")}
            disabled={foldersLoading}
            className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Select a folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          {errors.folderId && (
            <p className="mt-1 text-xs text-red-600">{errors.folderId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save Document"}
          </button>
        </div>
      </form>
    );
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = aiForm;

  return (
    <form onSubmit={handleSubmit(onConfirm)} className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none"
          placeholder="Document title"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="sm:col-span-2 grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <div className="mt-1 flex flex-col gap-1">
            <div ref={categoryDropdownRef} className="flex rounded-2xl border border-default bg-surface">
            <input
              id="categoryName"
              type="text"
              autoComplete="off"
              {...register("categoryName")}
              value={categoryName}
              onChange={(event) => {
                const value = event.target.value;
                setValue("categoryName", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                if (categoryId) {
                  setValue("categoryId", undefined, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }
              }}
              className="flex-1 rounded-l-2xl border-none bg-transparent px-4 py-2 text-foreground placeholder-secondary focus:outline-none"
              placeholder="Select or type a category"
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-r-2xl border-l border-default bg-surface px-3 py-2 text-secondary hover:bg-[var(--color-bg-secondary)]"
                ariaLabel="Category options"
              >
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" fullWidth width={categoryDropdownWidth ?? undefined} className="max-h-72 overflow-auto">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => {
                        setValue("categoryId", category.id, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        setValue("categoryName", category.name, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No categories match your search.
                  </DropdownMenuItem>
                )}
                {canCreateCategory ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setValue("categoryId", undefined, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                      setValue("categoryName", categoryName.trim(), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    Create new category &quot;{categoryName.trim()}&quot;
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
          {errors.categoryId && (
            <p className="text-xs text-red-600">{errors.categoryId.message}</p>
          )}
          {categoryName.trim() && !categoryId ? (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <strong>New category detected:</strong> {categoryName.trim()}. It will be created automatically.
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="documentDate" className="block text-sm font-medium text-foreground">
            Document Date
          </label>
          <DatePicker
            id="documentDate"
            name="documentDate"
            value={watch("documentDate") ?? null}
            onChange={(value) => {
              setValue("documentDate", value ?? "", {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
            placeholder="Document date"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="summary" className="block text-sm font-medium text-foreground">
          Summary
        </label>
        <textarea
          id="summary"
          {...register("summary")}
          rows={4}
          className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none"
          placeholder="Document summary"
        />
        {errors.summary && (
          <p className="mt-1 text-xs text-red-600">{errors.summary.message}</p>
        )}
      </div>

      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="documentOwner" className="block text-sm font-medium text-foreground">Document Owner</label>
          <input id="documentOwner" type="text" {...register("documentOwner")} className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-foreground">Author</label>
          <input id="author" type="text" {...register("author")} className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label htmlFor="concerning" className="block text-sm font-medium text-foreground">Concerning</label>
          <input id="concerning" type="text" {...register("concerning")} className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-foreground">Purpose</label>
          <input id="purpose" type="text" {...register("purpose")} className="mt-1 w-full rounded-2xl border border-default bg-surface px-4 py-2 text-foreground placeholder-secondary focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div className="sm:col-span-2 flex flex-col gap-2 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 rounded-2xl border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Confirming..." : "Confirm Upload"}
        </button>
      </div>
    </form>
  );
}
