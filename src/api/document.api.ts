import { apiClient } from "@/api/api-client";
import type { ApiSuccessEnvelope } from "@/types/http";
import { normalizeTrashItem } from "@/api/trash.api";
import type { TrashItem } from "@/types/trash";
import type {
  CreateDocumentInput,
  Document,
  DocumentFilters,
  DocumentListResponse,
  MoveDocumentInput,
  ProcessDocumentResult,
  RenameDocumentInput,
  UpdateDocumentInput,
  ConfirmDocumentData,
  BulkUploadItem,
  UploadFolderResult,
  UploadProcessingMode,
} from "@/types/document";

type DocumentApiRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  extractedText: string;
  processingStatus: string;
  title: string;
  summary: string;
  documentOwner?: string | null;
  author?: string | null;
  documentType?: string | null;
  concerning?: string | null;
  purpose?: string | null;
  documentDate?: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  folder: {
    id: string;
    name: string;
  };
  uploadedBy: {
    id: string;
    name: string;
  };
  organizationId: string;
};

type ProcessDocumentApiRecord = {
  title: string;
  category: string;
  summary: string;
  documentOwner?: string | null;
  author?: string | null;
  documentType?: string | null;
  concerning?: string | null;
  purpose?: string | null;
  documentDate?: string | null;
};

function normalizeDocument(document: DocumentApiRecord): Document {
  return {
    id: document.id,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    extractedText: document.extractedText,
    processingStatus: (document.processingStatus ?? "").toLowerCase() as any,
    title: document.title,
    summary: document.summary,
    documentOwner: document.documentOwner ?? null,
    author: document.author ?? null,
    documentType: document.documentType ?? null,
    concerning: document.concerning ?? null,
    purpose: document.purpose ?? null,
    documentDate: document.documentDate ?? null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    category: document.category,
    folder: document.folder,
    uploadedBy: document.uploadedBy,
    organizationId: document.organizationId,
  };
}

function buildDocumentsPath(filters?: DocumentFilters): string {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters?.folderId) {
    params.set("folderId", filters.folderId);
  }

  if (filters?.page !== undefined) {
    params.set("page", String(filters.page));
  }

  if (filters?.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  const queryString = params.toString();
  return queryString ? `/documents?${queryString}` : "/documents";
}

export const documentApi = {
  async processDocument(
    extractedText: string,
  ): Promise<ProcessDocumentResult> {
    const response = await apiClient.post<
      ApiSuccessEnvelope<ProcessDocumentApiRecord>
    >("/documents/process", { extractedText });

    return response.data;
  },

  async createDocument(data: CreateDocumentInput): Promise<Document> {
    const response = await apiClient.post<ApiSuccessEnvelope<DocumentApiRecord>>(
      "/documents",
      data,
    );

    return normalizeDocument(response.data);
  },

  async getDocuments(filters?: DocumentFilters): Promise<DocumentListResponse> {
    const response = await apiClient.get<
      ApiSuccessEnvelope<{
        data: DocumentApiRecord[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(buildDocumentsPath(filters));

    return {
      documents: response.data.data.map(normalizeDocument),
      pagination: response.data.meta,
    };
  },

  async getDocumentById(id: string): Promise<Document> {
    const response = await apiClient.get<ApiSuccessEnvelope<DocumentApiRecord>>(
      `/documents/${id}`,
    );

    return normalizeDocument(response.data);
  },

  async updateDocument(
    id: string,
    data: UpdateDocumentInput,
  ): Promise<Document> {
    const response = await apiClient.patch<ApiSuccessEnvelope<DocumentApiRecord>>(
      `/documents/${id}`,
      data,
    );

    return normalizeDocument(response.data);
  },

  async deleteDocument(id: string): Promise<TrashItem> {
    const response = await apiClient.delete<ApiSuccessEnvelope<Parameters<typeof normalizeTrashItem>[0]>>(
      `/documents/${id}`,
    );

    return normalizeTrashItem(response.data);
  },

  async bulkUpload(
    items: BulkUploadItem[],
    folderId?: string,
  ): Promise<{ saved: Document[]; failed: { fileName: string; reason: string }[] }> {
    const form = new FormData();
    items.forEach((item) => form.append("files", item.file));
    form.append(
      "modes",
      JSON.stringify(items.map((item) => item.mode)),
    );
    form.append(
      "fileTypes",
      JSON.stringify(items.map((item) => item.fileType)),
    );
    form.append(
      "fileNames",
      JSON.stringify(items.map((item) => item.fileName)),
    );
    if (folderId) form.append("folderId", folderId);

    const response = await apiClient.postFormData<
      ApiSuccessEnvelope<{
        saved?: DocumentApiRecord[];
        failed?: { fileName: string; reason: string }[];
      }>
    >("/documents/bulk", form);

    const saved = response.data?.saved ?? [];
    const failed = response.data?.failed ?? [];

    return {
      saved: Array.isArray(saved) ? saved.map(normalizeDocument) : [],
      failed: Array.isArray(failed) ? failed : [],
    };
  },

  async moveToFolder(id: string, moveDocumentDto: MoveDocumentInput): Promise<Document> {
    const response = await apiClient.patch<ApiSuccessEnvelope<DocumentApiRecord>>(
      `/documents/${id}/move`,
      moveDocumentDto,
    );

    return normalizeDocument(response.data);
  },

  async renameDocument(id: string, renameDocumentDto: RenameDocumentInput): Promise<Document> {
    const response = await apiClient.patch<ApiSuccessEnvelope<DocumentApiRecord>>(
      `/documents/${id}/rename`,
      renameDocumentDto,
    );

    return normalizeDocument(response.data);
  },

  async getInbox(): Promise<Document[]> {
    const response = await apiClient.get<ApiSuccessEnvelope<DocumentApiRecord[]>>(
      "/documents/inbox",
    );

    const docs = response.data ?? [];
    return Array.isArray(docs) ? docs.map(normalizeDocument) : [];
  },
  async confirmDocument(id: string, data: Partial<ConfirmDocumentData>): Promise<Document> {
    const response = await apiClient.patch<ApiSuccessEnvelope<DocumentApiRecord>>(
      `/documents/${id}/confirm`,
      data,
    );

    return normalizeDocument(response.data);
  },

  async uploadFolder({
    files,
    paths,
    parentFolderId,
    rootFolderName,
    modes,
  }: {
    files: File[];
    paths: string[];
    parentFolderId?: string | null;
    rootFolderName?: string;
    modes?: UploadProcessingMode[];
  }): Promise<UploadFolderResult> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    form.append("paths", JSON.stringify(paths));

    if (parentFolderId) {
      form.append("parentFolderId", parentFolderId);
    }
    if (rootFolderName?.trim()) {
      form.append("rootFolderName", rootFolderName.trim());
    }
    if (modes && modes.length > 0) {
      form.append("modes", JSON.stringify(modes));
    }

    const response = await apiClient.postFormData<
      ApiSuccessEnvelope<{
        folder: {
          id: string;
          name: string;
          slug: string;
        };
        createdFoldersCount?: number;
        foldersCreated?: number;
        uploadedDocuments?: DocumentApiRecord[];
        saved?: DocumentApiRecord[];
        failures?: { fileName: string; reason: string }[];
        failed?: { fileName: string; reason: string }[];
      }>
    >("/documents/upload-folder", form);

    const uploadedDocs =
      response.data?.uploadedDocuments ?? response.data?.saved ?? [];
    const failuresList =
      response.data?.failures ?? response.data?.failed ?? [];
    const createdCount =
      response.data?.createdFoldersCount ??
      response.data?.foldersCreated ??
      0;

    return {
      folder: response.data?.folder ?? { id: "", name: "", slug: "" },
      createdFoldersCount: createdCount,
      uploadedDocuments: Array.isArray(uploadedDocs)
        ? uploadedDocs.map(normalizeDocument)
        : [],
      failures: Array.isArray(failuresList) ? failuresList : [],
    };
  },
};
