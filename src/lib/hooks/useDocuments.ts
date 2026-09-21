"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "@/api/document.api";
import {
  invalidateTrashRelatedQueries,
  showMovedToTrashToast,
} from "@/lib/trash-toast";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import type {
  CreateDocumentInput,
  Document,
  DocumentFilters,
  DocumentListResponse,
  UpdateDocumentInput,
  ConfirmDocumentData,
  BulkUploadItem,
  UploadProcessingMode,
} from "@/types/document";

export function useProcessDocument() {
  const mutation = useMutation({
    mutationFn: (extractedText: string) =>
      documentApi.processDocument(extractedText),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

export function useGetDocuments(filters?: DocumentFilters) {
  const query = useQuery<DocumentListResponse, Error>({
    queryKey: ["documents", filters],
    queryFn: () => documentApi.getDocuments(filters),
  });

  return {
    documents: query.data?.documents ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useGetDocumentById(id: string) {
  const query = useQuery({
    queryKey: ["documents", id],
    queryFn: () => documentApi.getDocumentById(id),
    enabled: Boolean(id),
  });

  return {
    document: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CreateDocumentInput) =>
      documentApi.createDocument(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useConfirmDocument() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmDocumentData }) =>
      documentApi.confirmDocument(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) =>
      documentApi.updateDocument(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: async (trashItem, deletedDocumentId) => {
      const removedId = trashItem.documentId ?? deletedDocumentId;
      queryClient.setQueryData<Document[]>(["tray"], (current) =>
        current?.filter((doc) => doc.id !== removedId) ?? [],
      );
      await invalidateTrashRelatedQueries(queryClient);
      showMovedToTrashToast(trashItem.id, queryClient);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
}

export function useBulkUpload() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (
      payload: BulkUploadItem[] | { items: BulkUploadItem[]; folderId?: string },
    ) => {
      if (Array.isArray(payload)) {
        return documentApi.bulkUpload(payload);
      }
      return documentApi.bulkUpload(payload.items, payload.folderId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useUploadFolder() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: {
      files: File[];
      paths: string[];
      parentFolderId?: string | null;
      rootFolderName?: string;
      modes?: UploadProcessingMode[];
    }) => documentApi.uploadFolder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

export function useMoveToFolder() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string }) =>
      documentApi.moveToFolder(id, { folderId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useRenameDocument() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      documentApi.renameDocument(id, { fileName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useGetInbox() {
  const prevRef = useRef<Document[] | null>(null);

  const query = useQuery<Document[], Error, Document[]>({
    queryKey: ["tray"],
    queryFn: () => documentApi.getInbox(),
    refetchInterval: (query) => {
      const data = query.state.data;
      return Array.isArray(data) &&
        data.some((d) => d.processingStatus === "processing")
        ? 2500
        : false;
    },
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const prev = prevRef.current;
    const prevHasProcessing = prev?.some((d) => d.processingStatus === "processing");
    const nowHasProcessing = query.data.some((d) => d.processingStatus === "processing");
    const nowHasReady = query.data.some((d) => d.processingStatus === "ready");

    if (prevHasProcessing && !nowHasProcessing && nowHasReady) {
      toast.success("Document(s) are ready for review");
    }

    prevRef.current = query.data;
  }, [query.data]);

  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
