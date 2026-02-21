import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  EMPTY,
  lastValueFrom,
  map,
  retry,
  timer,
} from 'rxjs';

import { ApiResponse, UploadItem } from '../models/api.models';
import { UploadTrackerService } from './upload-tracker.service';
import {
  ChunkedUploadChunkResponse,
  ChunkedUploadCompleteResponse,
  ChunkedUploadInitRequest,
  ChunkedUploadInitResponse,
} from './upload.models';

/** Size of each chunk sent over the wire (40 MB). */
const CHUNK_SIZE = 40 * 1024 * 1024;

/** Max retries per chunk before giving up. */
const MAX_RETRIES = 3;

/** Threshold in bytes: files >= this size use chunked upload. */
export const CHUNKED_UPLOAD_THRESHOLD = 80 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class ChunkedUploadService {
  private readonly http = inject(HttpClient);
  private readonly tracker = inject(UploadTrackerService);

  /**
   * Uploads a single large file using chunked upload protocol.
   *
   * Flow: init → send chunks sequentially → complete.
   * Each chunk is retried up to MAX_RETRIES times with exponential backoff.
   * Progress is reported per-chunk to the UploadTrackerService.
   *
   * @returns Promise resolving to the final UploadItem on success.
   */
  async uploadFile(
    file: File,
    destination: string,
    trackerId: string,
    conflictPolicy?: string,
  ): Promise<UploadItem> {
    // 1. Init
    const initReq: ChunkedUploadInitRequest = {
      file_name: file.name,
      file_size: file.size,
      chunk_size: CHUNK_SIZE,
      destination,
      conflict_policy: conflictPolicy,
    };

    const initRes = await lastValueFrom(
      this.http
        .post<ApiResponse<ChunkedUploadInitResponse>>('/api/v1/uploads/init', initReq)
        .pipe(map((r) => r.data as ChunkedUploadInitResponse)),
    );

    const { upload_id, total_chunks } = initRes;

    try {
      // 2. Send chunks sequentially
      for (let i = 0; i < total_chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const blob = file.slice(start, end);

        await lastValueFrom(
          this.sendChunk(upload_id, i, blob).pipe(
            retry({
              count: MAX_RETRIES,
              delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000),
            }),
          ),
        );

        // Update progress after each successful chunk.
        const loaded = Math.min(end, file.size);
        this.tracker.updateSingleProgress(trackerId, loaded, file.size);
      }

      // 3. Complete
      const completeRes = await lastValueFrom(
        this.http
          .post<ApiResponse<ChunkedUploadCompleteResponse>>(
            `/api/v1/uploads/${upload_id}/complete`,
            null,
          )
          .pipe(map((r) => r.data as ChunkedUploadCompleteResponse)),
      );

      return completeRes.file;
    } catch (err) {
      // Best-effort abort on failure — don't throw from abort itself.
      this.http.delete(`/api/v1/uploads/${upload_id}`).pipe(catchError(() => EMPTY)).subscribe();
      throw err;
    }
  }

  private sendChunk(uploadId: string, chunkIndex: number, blob: Blob) {
    return this.http
      .put<ApiResponse<ChunkedUploadChunkResponse>>(
        `/api/v1/uploads/${uploadId}/chunks/${chunkIndex}`,
        blob,
        { headers: { 'Content-Type': 'application/octet-stream' } },
      )
      .pipe(map((r) => r.data as ChunkedUploadChunkResponse));
  }
}
