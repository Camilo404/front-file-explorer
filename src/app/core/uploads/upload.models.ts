export type UploadEntryStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadEntry {
  id: string;
  fileName: string;
  fileSize: number;
  loaded: number;
  total: number;
  /** Progress percentage from 0 to 100. */
  progress: number;
  status: UploadEntryStatus;
  errorReason?: string;
}

// ── Chunked upload models ────────────────────────────────────────

export interface ChunkedUploadInitRequest {
  file_name: string;
  file_size: number;
  chunk_size: number;
  destination: string;
  conflict_policy?: string;
}

export interface ChunkedUploadInitResponse {
  upload_id: string;
  chunk_size: number;
  total_chunks: number;
}

export interface ChunkedUploadChunkResponse {
  upload_id: string;
  chunk_index: number;
  chunks_received: number;
}

export interface ChunkedUploadCompleteResponse {
  file: import('../models/api.models').UploadItem;
}
