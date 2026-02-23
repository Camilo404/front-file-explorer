export enum WSEventType {
  FileCreated = 'file.created',
  FileUploaded = 'file.uploaded',
  FileDeleted = 'file.deleted',
  FileMoved = 'file.moved',
  FileCopied = 'file.copied',
  DirCreated = 'dir.created',
  JobStarted = 'job.started',
  JobProgress = 'job.progress',
  JobCompleted = 'job.completed',
  JobFailed = 'job.failed',
  FileCompressed = 'file.compressed',
  FileDecompressed = 'file.decompressed'
}

export interface WSEvent<T = any> {
  id: string;
  type: WSEventType;
  payload: T;
  timestamp: string;
  actor_id?: string;
}

export interface WSJobPayload {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'partial';
  progress: number;
  processed_items: number;
  total_items: number;
  success_items: number;
  failed_items: number;
  operation?: string;
}

export interface WSFilePayload {
  path: string;
  name?: string;
  size?: number;
  mime_type?: string;
  parent?: string;
}

export interface WSMoveCopyPayload {
  from: string;
  to: string;
}
