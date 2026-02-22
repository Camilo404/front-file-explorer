/**
 * Utility functions for working with FileItem objects.
 * Centralizes type-checking logic to avoid duplication across components.
 */
import { FileItem } from '../../core/models/api.models';

/**
 * Normalizes a file type string for comparison.
 * Handles variations like 'dir', 'directory', 'folder'.
 */
export function normalizeFileType(type: string): string {
  return type.trim().toLowerCase();
}

/**
 * Checks if a type string represents a directory.
 * Accepts 'dir', 'directory', or 'folder' as valid directory types.
 */
export function isDirectoryType(type: string): boolean {
  const normalizedType = normalizeFileType(type);
  return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
}

/**
 * Checks if a FileItem represents a directory.
 * Accepts 'dir', 'directory', or 'folder' as valid directory types.
 */
export function isDirectory(item: FileItem): boolean {
  return isDirectoryType(item.type);
}

/**
 * Checks if a FileItem represents an image file.
 * Uses the is_image flag if available, otherwise checks mime type.
 */
export function isImage(item: FileItem): boolean {
  if (isDirectory(item)) {
    return false;
  }
  if (item.is_image === true) {
    return true;
  }
  return item.mime_type?.startsWith('image/') ?? false;
}

/**
 * Checks if a FileItem represents a video file.
 * Uses the is_video flag if available, otherwise checks mime type.
 */
export function isVideo(item: FileItem): boolean {
  if (isDirectory(item)) {
    return false;
  }
  if (item.is_video === true) {
    return true;
  }
  return item.mime_type?.startsWith('video/') ?? false;
}

/**
 * Checks if a FileItem represents a media file (image or video).
 */
export function isMedia(item: FileItem): boolean {
  return isImage(item) || isVideo(item);
}

/**
 * Gets the appropriate Font Awesome icon class for a FileItem.
 * Returns the icon class without the 'fa-solid' prefix.
 */
export function getFileIconClass(item: FileItem): string {
  if (isDirectory(item)) {
    return 'fa-folder';
  }
  if (item.is_image) {
    return 'fa-image';
  }
  if (item.is_video) {
    return 'fa-video';
  }
  if (item.extension === '.pdf') {
    return 'fa-file-pdf';
  }
  if (['.zip', '.rar', '.tar', '.gz'].includes(item.extension || '')) {
    return 'fa-file-zipper';
  }
  if (['.doc', '.docx'].includes(item.extension || '')) {
    return 'fa-file-word';
  }
  if (['.xls', '.xlsx'].includes(item.extension || '')) {
    return 'fa-file-excel';
  }
  if (['.txt', '.md', '.csv'].includes(item.extension || '')) {
    return 'fa-file-lines';
  }
  return 'fa-file';
}

/**
 * Gets the appropriate color class for a file icon.
 */
export function getFileIconColorClass(item: FileItem): string {
  if (isDirectory(item)) {
    return 'text-violet-400';
  }
  if (item.is_image) {
    return 'text-emerald-400';
  }
  if (item.is_video) {
    return 'text-rose-400';
  }
  if (item.extension === '.pdf') {
    return 'text-red-400';
  }
  if (['.zip', '.rar', '.tar', '.gz'].includes(item.extension || '')) {
    return 'text-amber-400';
  }
  if (['.doc', '.docx'].includes(item.extension || '')) {
    return 'text-blue-400';
  }
  if (['.xls', '.xlsx'].includes(item.extension || '')) {
    return 'text-green-400';
  }
  return 'text-zinc-400';
}