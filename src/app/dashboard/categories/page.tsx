"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableLoading,
  TableEmpty,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategories,
} from "@/lib/hooks/useCategories";
import { Role } from "@/types/enum";

const PAGE_SIZE = 10;

export default function DashboardCategoriesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { categories, pagination, isLoading: isCategoriesLoading, isError } =
    useGetCategories({
      page,
      limit: PAGE_SIZE,
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

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleAddCategory = async (name: string) => {
    createCategory(
      { name },
      {
        onSuccess: (category) => {
          toast.success(`Category "${category.name}" created successfully`);
          setPage(1);
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Unable to create category.";
          toast.error(message);
        },
      },
    );
  };

  const handleDeleteCategory = async (categoryId: string) => {
    deleteCategory(categoryId, {
      onSuccess: () => {
        toast.success("Category deleted successfully");
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

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
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

      {isCategoriesLoading ? (
        <TableContainer>
          <Table className="min-w-[640px]">
            <TableHeader>
              <tr>
                <TableHead>Category</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Created</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              <TableLoading colSpan={4} rows={5} />
            </TableBody>
          </Table>
        </TableContainer>
      ) : categories.length > 0 ? (
        <>
          <p className="text-sm text-secondary">
            {totalCategories === 1
              ? "1 category"
              : `${totalCategories} categories`}
            {totalPages > 1
              ? ` · Page ${page} of ${totalPages}`
              : null}
          </p>

          <TableContainer>
            <Table className="min-w-[640px]">
              <TableHeader>
                <tr>
                  <TableHead>Category</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onDelete={handleDeleteCategory}
                    isDeleting={isDeletingCategory}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalCategories)} of {totalCategories}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isCategoriesLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-4 py-2 text-sm text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isCategoriesLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-4 py-2 text-sm text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No categories yet"
          description="Create categories to organize documents by topic and team needs."
          actionLabel="Add Category"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddCategory}
        isSubmitting={isCreatingCategory}
      />
    </div>
  );
}
