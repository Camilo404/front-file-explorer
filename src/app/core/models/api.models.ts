export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiMeta;
}

export type UserRole = 'viewer' | 'editor' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface FileItem {
  name: string;
  path: string;
  type: string;
  size: number;
  size_human?: string;
  mime_type?: string;
  extension?: string;
  preview_url?: string;
  thumbnail_url?: string;
  is_image?: boolean;
  is_video?: boolean;
  modified_at: string;
  created_at: string;
  match_context?: string;
  permissions: string;
  item_count?: number;
}

export interface DirectoryListData {
  current_path: string;
  parent_path: string;
  items: FileItem[];
}

export interface DirectoryCreateData {
  name: string;
  path: string;
  type: string;
  created_at: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: string;
  has_children: boolean;
  item_count?: number;
  modified_at: string;
  children?: TreeNode[];
}

export interface TreeData {
  path: string;
  nodes: TreeNode[];
}

export interface UploadItem {
  name: string;
  path: string;
  size: number;
  mime_type: string;
}

export interface UploadFailure {
  name: string;
  reason: string;
}

export interface UploadResponse {
  uploaded: UploadItem[];
  failed: UploadFailure[];
}

export interface RenameResponse {
  old_path: string;
  new_path: string;
  name: string;
}

export interface MoveCopyResult {
  from: string;
  to: string;
}

export interface MoveCopyFailure {
  from: string;
  reason: string;
}

export interface MoveResponse {
  moved: MoveCopyResult[];
  failed: MoveCopyFailure[];
}

export interface CopyResponse {
  copied: MoveCopyResult[];
  failed: MoveCopyFailure[];
}

export interface DeleteFailure {
  path: string;
  reason: string;
}

export interface DeleteResponse {
  deleted: string[];
  failed: DeleteFailure[];
}

export interface RestoreFailure {
  path: string;
  reason: string;
}

export interface RestoreResponse {
  restored: string[];
  failed: RestoreFailure[];
}

export interface TrashRecord {
  id: string;
  original_path: string;
  trash_name: string;
  deleted_at: string;
  deleted_by: AuditActor;
  restored_at?: string;
  restored_by?: AuditActor;
}

export interface TrashListData {
  items: TrashRecord[];
}

export interface SearchData {
  query: string;
  items: FileItem[];
}

export interface JobItemResult {
  from?: string;
  to?: string;
  path?: string;
  status: string;
  reason?: string;
}

export interface JobData {
  job_id: string;
  operation: string;
  status: string;
  conflict_policy?: string;
  total_items: number;
  processed_items: number;
  success_items: number;
  failed_items: number;
  progress: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  items?: JobItemResult[];
}

export interface JobItemsData {
  job_id: string;
  items: JobItemResult[];
}

export interface AuditActor {
  user_id?: string;
  username?: string;
  role?: string;
  ip?: string;
}

export interface AuditEntry {
  action: string;
  occurred_at: string;
  actor: AuditActor;
  status: string;
  resource?: string;
  before?: unknown;
  after?: unknown;
  error?: string;
}

export interface AuditListData {
  items: AuditEntry[];
}

export interface StorageStats {
  total_size: number;
  total_size_human: string;
  file_count: number;
  directory_count: number;
}

export interface JobUpdate {
  job_id: string;
  status: string;
  progress: number;
  processed_items: number;
  total_items: number;
  success_items: number;
  failed_items: number;
}

export interface ShareRecord {
  id: string;
  token: string;
  path: string;
  created_by: string;
  created_at: string;
  expires_at: string;
}

export interface ShareListData {
  shares: ShareRecord[];
}

export interface UserListData {
  users: AuthUser[];
}
