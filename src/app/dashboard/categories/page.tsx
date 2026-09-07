"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { DataTable, type ColumnDef } from "@/components/table/page";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategories,
} from "@/lib/hooks/useCategories";
import { Role } from "@/types/enum";
import type { Category } from "@/types/category";

const PAGE_SIZE = 10;

export default function DashboardCategoriesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { categories, pagination, isLoading: isCategoriesLoading, isError } =
    useGetCategories({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
    });
  const { mutate: createCategory, isLoading: isCreatingCategory } =
    useCreateCategory();
  const { mutate: deleteCategory, isLoading: isDeletingCategory } =
    useDeleteCategory();

  const totalPages = pagination?.totalPages ?? 1;
  const totalCategories = pagination?.total ?? 0;

  useEffect(() => {
    if (!isLoading && user?.role === Role.MEMBER) {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  const activePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const handleAddCategory = async (name: string) => {
    createCategory(
      { name },
      {
        onSuccess: (category) => {
          toast.success(`Category "${category.name}" created successfully`);
          setPage(1);
          setIsModalOpen(false);
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Unable to create category.";
          toast.error(message);
        },
      },
    );
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id, {
      onSuccess: () => {
        toast.success("Category deleted successfully");
        setCategoryToDelete(null);
        if (categories.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Unable to delete category.";
        toast.error(message);
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const addCategoryButton = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
    >
      <Plus className="h-4 w-4" />
      Add Category
    </button>
  );

  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Category",
        sortable: true,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{row.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {row.slug ? `/${row.slug}` : "Category"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "documentCount",
        accessorKey: "documentCount",
        header: "Documents",
        sortable: true,
        cell: ({ row }) => {
          const documentCount = row.documentCount ?? 0;
          return (
            <span className="tabular-nums text-secondary">
              <span
                className={
                  documentCount > 0
                    ? "font-medium text-foreground"
                    : "text-muted"
                }
              >
                {documentCount}
              </span>
              <span className="ml-1 text-muted">
                {documentCount === 1 ? "document" : "documents"}
              </span>
            </span>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">
            {new Date(row.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => {
          const documentCount = row.documentCount ?? 0;
          const hasDocuments = documentCount > 0;

          return (
            <div
              className="flex items-center justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setCategoryToDelete(row)}
                disabled={isDeletingCategory || hasDocuments}
                title={
                  hasDocuments
                    ? "Reassign documents before deleting this category"
                    : `Delete ${row.name}`
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-default bg-surface text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${row.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [isDeletingCategory],
  );

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <LoadingSkeleton width={280} height={32} />
        <LoadingSkeleton height={320} rounded="1rem" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <OrgPageHeader
          title="Categories"
          description="Manage document categories and keep the workspace organized."
          action={addCategoryButton}
        />
        <EmptyState
          title="Unable to load categories"
          description="Try again in a moment."
          actionLabel="Retry"
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <OrgPageHeader
        title="Categories"
        description="Manage document categories and keep the workspace organized."
        action={addCategoryButton}
      />

      <DataTable<Category>
        data={categories}
        columns={columns}
        isLoading={isCategoriesLoading}
        emptyMessage="No categories found."
        searchable={true}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search categories..."
        paginated={true}
        page={activePage}
        pageSize={pageSize}
        totalItems={totalCategories}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50]}
      />

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddCategory}
        isSubmitting={isCreatingCategory}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This cannot be undone.`}
        itemNameToConfirm={categoryToDelete?.name ?? ""}
        isLoading={isDeletingCategory}
      />
    </div>
  );
}
