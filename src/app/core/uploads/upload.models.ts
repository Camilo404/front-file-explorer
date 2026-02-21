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
