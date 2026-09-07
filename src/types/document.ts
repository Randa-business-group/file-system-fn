export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  extractedText: string;
  processingStatus: 'processing' | 'ready' | 'confirmed';
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
}

export interface ConfirmDocumentData {
  title?: string | null;
  documentOwner?: string | null;
  author?: string | null;
  documentType?: string | null;
  concerning?: string | null;
  purpose?: string | null;
  documentDate?: string | null;
  summary?: string | null;
  categoryId?: string | null;
  folderId?: string | null;
}

export type SortOption =
  | "name_asc"
  | "name_desc"
  | "date_asc"
  | "date_desc";

export interface ProcessDocumentResult {
  title: string;
  category: string;
  summary: string;
  documentOwner?: string | null;
  author?: string | null;
  documentType?: string | null;
  concerning?: string | null;
  purpose?: string | null;
  documentDate?: string | null;
}

export interface CreateDocumentInput {
  fileUrl: string;
  fileName: string;
  extractedText: string;
  title: string;
  summary: string;
  categoryId?: string;
  // folderId is provided by the upload context (optional when called programmatically)
  folderId?: string;
  // optional AI-extracted fields - user can edit before confirming
  documentOwner?: string;
  author?: string;
  documentType?: string;
  concerning?: string;
  purpose?: string;
  documentDate?: string;
  // optional category name suggested by AI; server will resolve/create
  category?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  summary?: string | null;
  documentOwner?: string | null;
  author?: string | null;
  documentType?: string | null;
  concerning?: string | null;
  purpose?: string | null;
  documentDate?: string | null;
  categoryId?: string;
  folderId?: string;
  fileUrl?: string;
  fileName?: string;
  extractedText?: string;
  category?: string;
}

export interface DocumentFilters {
  search?: string;
  categoryId?: string;
  folderId?: string;
  page?: number;
  limit?: number;
}

export interface DocumentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: DocumentPagination;
}

export type UploadProcessingMode = "ai" | "manual";

export interface BulkUploadFailure {
  fileName: string;
  reason: string;
}

export interface BulkUploadFile {
  file: File;
  fileName: string;
  preview: string;
  size: number;
  fileType: string;
  mode: UploadProcessingMode;
  status: "pending" | "uploading" | "queued" | "done" | "error";
  error?: string;
}

export interface BulkUploadItem {
  file: File;
  fileName: string;
  fileType: string;
  mode: UploadProcessingMode;
}

export interface MoveDocumentInput {
  folderId: string;
}

export interface RenameDocumentInput {
  fileName: string;
}

export interface FolderUploadFileItem {
  file: File;
  relativePath: string;
  fileName: string;
  size: number;
  mode: UploadProcessingMode;
  status: "pending" | "uploading" | "queued" | "done" | "error";
  error?: string;
}

export interface UploadFolderResult {
  folder: {
    id: string;
    name: string;
    slug: string;
  };
  createdFoldersCount: number;
  uploadedDocuments: Document[];
  failures: BulkUploadFailure[];
}
