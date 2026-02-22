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
  /** Upload speed in bytes per second. */
  speed?: number;
  /** Estimated time remaining in seconds. */
  remainingTime?: number;
  /** Timestamp when the upload started. */
  startTime?: number;
  /** Last timestamp when progress was updated. */
  lastUpdated?: number;
  /** Bytes loaded at last update. */
  lastLoaded?: number;
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
