import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpEventType } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { ExplorerApiService } from '../../core/api/explorer-api.service';
import { FilesApiService } from '../../core/api/files-api.service';
import { ConflictPolicy, OperationsApiService } from '../../core/api/operations-api.service';
import { SearchApiService } from '../../core/api/search-api.service';
import { SharesApiService } from '../../core/api/shares-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { API_BASE_URL } from '../../core/http/api-base-url.token';
import { UploadTrackerService } from '../../core/uploads/upload-tracker.service';
import { FileItem, TreeNode } from '../../core/models/api.models';
import { ContextMenuAction, ContextMenuComponent } from './components/context-menu.component';
import { ExplorerToolbarComponent, SearchFilters } from './components/explorer-toolbar.component';
import { FileListComponent } from './components/file-list.component';
import { ImageViewerComponent } from './components/image-viewer.component';
import { VideoViewerComponent } from './components/video-viewer.component';
import { TreePanelComponent } from './components/tree-panel.component';
import { FileDetailsComponent } from './components/file-details.component';
import { ConflictResolutionModalComponent } from '../../shared/components/conflict-resolution-modal.component';
import { InputModalComponent } from '../../shared/components/input-modal.component';

interface ExplorerUiState {
  currentPath: string;
  page: number;
  limit: number;
  searchFilters: SearchFilters | null;
  pathHistory: string[];
  expandedTreePaths: string[];
}

interface ActiveModalConfig {
  title: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-explorer-page',
  imports: [TreePanelComponent, FileListComponent, ContextMenuComponent, ImageViewerComponent, VideoViewerComponent, ExplorerToolbarComponent, InputModalComponent, ConflictResolutionModalComponent, FileDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeContextMenu()',
  },
  template: `
    <section class="space-y-4 p-2 sm:p-4 h-screen flex flex-col overflow-hidden">
      <nav class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-zinc-900/40 px-5 py-3.5 text-sm shadow-xl backdrop-blur-2xl ring-1 ring-white/5 shrink-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <!-- Tree toggle: only visible on mobile -->
          <button
            type="button"
            class="lg:hidden flex items-center justify-center size-9 rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white mr-2"
            aria-label="Mostrar árbol de directorios"
            (click)="isMobileTreeOpen.set(!isMobileTreeOpen())"
          >
            <i class="fa-solid fa-folder-tree text-violet-400"></i>
          </button>
        </div>
        <app-explorer-toolbar
          class="flex-1"
          (refreshClick)="refresh()"
          (newDirectoryClick)="openCreateDirectoryModal()"
          (uploadFiles)="uploadFiles($event)"
          (search)="runSearch($event)"
          (clearSearchEvent)="clearSearch()"
        />
      </nav>

      <!-- Mobile tree backdrop -->
      @if (isMobileTreeOpen()) {
        <div
          class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          (click)="isMobileTreeOpen.set(false)"
        ></div>
      }

      <div class="flex flex-1 gap-3 min-h-0 relative">
        <!-- Tree panel: fixed drawer on mobile, in-grid on desktop -->
        <div
          class="fixed top-16 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out
                 lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:top-auto lg:bottom-auto shrink-0"
          [class.-translate-x-full]="!isMobileTreeOpen()"
        >
          <app-tree-panel
            class="h-full min-w-0"
            [closeable]="true"
            [nodes]="treeNodes()"
            [currentPath]="currentPath()"
            [expandedPaths]="expandedTreePaths()"
            (selectPath)="navigateTo($event); isMobileTreeOpen.set(false)"
            (loadChildren)="loadTreeChildren($event)"
            (expandedPathsChange)="onExpandedPathsChange($event)"
            (close)="isMobileTreeOpen.set(false)"
          />
        </div>

        <div class="flex-1 min-w-0 h-full">
          <app-file-list
            class="h-full"
            [items]="items()"
            [selectedPaths]="selectedPaths()"
            [thumbnailUrls]="thumbnailUrls()"
            [page]="page()"
            [totalPages]="totalPages()"
            [totalItems]="totalItems()"
            [isSearchMode]="searchFilters() !== null"
            [parentPath]="parentPath()"
            (open)="openItem($event)"
            (selectionChange)="onSelectionChange($event)"
            (navigateToParent)="goParentFolder()"
            (moveItems)="handleMoveItems($event)"
            (uploadFiles)="uploadFiles($event)"
            (info)="showItemInfo($event)"
            (contextMenu)="openContextMenu($event)"
            (changePage)="changePage($event)"
          />
        </div>

        @if (selectedItem() && isDetailsPaneOpen() && !isDetailsSuppressedForSelection()) {
          <div class="hidden xl:block shrink-0 h-full">
            <app-file-details
              [item]="selectedItem()"
              [thumbnailUrl]="thumbnailUrls()[selectedItem()!.path]"
              (close)="isDetailsPaneOpen.set(false)"
              (open)="openItem($event)"
              (download)="downloadSelected()"
              (rename)="renameSelected()"
              (delete)="deleteSelected()"
            />
          </div>
        }
      </div>

      <app-context-menu
        [isOpen]="isContextMenuOpen()"
        [x]="contextMenuX()"
        [y]="contextMenuY()"
        [selectedCount]="selectedCount()"
        [canShare]="canShare()"
        (action)="handleContextMenuAction($event)"
        (close)="closeContextMenu()"
      />

      <app-image-viewer
        [open]="isImageViewerOpen()"
        [imageUrl]="viewerImageUrl()"
        [imageName]="viewerImageName()"
        [canPrev]="canShowPreviousImage()"
        [canNext]="canShowNextImage()"
        [imageIndex]="viewerImageIndex()"
        [totalImages]="viewerImagePaths().length"
        (close)="closeImageViewer()"
        (prev)="showPreviousImage()"
        (next)="showNextImage()"
      />

      <app-video-viewer
        [open]="isVideoViewerOpen()"
        [videoUrl]="viewerVideoUrl()"
        [videoName]="viewerVideoName()"
        [canPrev]="canShowPreviousVideo()"
        [canNext]="canShowNextVideo()"
        [videoIndex]="viewerVideoIndex()"
        [totalVideos]="viewerVideoPaths().length"
        (close)="closeVideoViewer()"
        (prev)="showPreviousVideo()"
        (next)="showNextVideo()"
      />

      <app-input-modal
        [open]="activeModal() !== null"
        [title]="activeModal()?.title ?? ''"
        [label]="activeModal()?.label"
        [placeholder]="activeModal()?.placeholder"
        [initialValue]="activeModal()?.initialValue ?? ''"
        [confirmLabel]="activeModal()?.confirmLabel"
        [isDanger]="activeModal()?.isDanger ?? false"
        (confirm)="onModalConfirm($event)"
        (cancel)="onModalCancel()"
      />

      <app-conflict-resolution-modal
        [open]="isConflictModalOpen()"
        [conflictingNames]="conflictingFileNames()"
        (resolve)="onConflictResolve($event)"
        (cancel)="onConflictCancel()"
      />
    </section>
  `,
})
export class ExplorerPage {
  private readonly explorerApi = inject(ExplorerApiService);
  private readonly searchApi = inject(SearchApiService);
  private readonly filesApi = inject(FilesApiService);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly sharesApi = inject(SharesApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly feedback = inject(ErrorStoreService);
  private readonly uploadTracker = inject(UploadTrackerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly storageKey = 'file-explorer.explorer-ui-state';

  readonly currentPath = signal('/');
  readonly pathHistory = signal<string[]>([]);
  readonly treeNodes = signal<TreeNode[]>([]);
  readonly expandedTreePaths = signal<string[]>([]);
  readonly items = signal<FileItem[]>([]);
  readonly thumbnailUrls = signal<Record<string, string>>({});
  readonly isImageViewerOpen = signal(false);
  readonly viewerImageUrl = signal<string | null>(null);
  readonly viewerImageName = signal('Imagen');
  readonly viewerImagePaths = signal<string[]>([]);
  readonly viewerImageIndex = signal(-1);
  readonly isVideoViewerOpen = signal(false);
  readonly viewerVideoUrl = signal<string | null>(null);
  readonly viewerVideoName = signal('Video');
  readonly viewerVideoPaths = signal<string[]>([]);
  readonly viewerVideoIndex = signal(-1);
  readonly selectedPaths = signal<string[]>([]);
  readonly isDetailsPaneOpen = signal(true);
  readonly searching = signal(false);
  readonly activeModal = signal<ActiveModalConfig | null>(null);
  readonly isConflictModalOpen = signal(false);
  readonly conflictingFileNames = signal<string[]>([]);

  private pendingModalAction: ((value: string) => void) | null = null;
  private pendingConflictFiles: File[] = [];
  private firstRoundUploadedCount = 0;
  readonly page = signal(1);
  readonly limit = signal(50);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly searchFilters = signal<SearchFilters | null>(null);
  readonly sharingPath = signal<string | null>(null);
  readonly suppressDetailsForPath = signal<string | null>(null);

  readonly isContextMenuOpen = signal(false);
  readonly contextMenuX = signal(0);
  readonly contextMenuY = signal(0);
  readonly isMobileTreeOpen = signal(false);

  readonly selectedCount = computed(() => this.selectedPaths().length);
  readonly selectedItem = computed(() => {
    const paths = this.selectedPaths();
    if (paths.length !== 1) return null;
    return this.items().find(i => i.path === paths[0]) || null;
  });
  readonly isDetailsSuppressedForSelection = computed(() => {
    const item = this.selectedItem();
    if (!item) return false;
    return this.suppressDetailsForPath() === item.path;
  });
  readonly canShare = computed(() => {
    const role = this.authStore.user()?.role;
    return role === 'editor' || role === 'admin';
  });
  readonly parentPath = computed<string | null>(() => {
    const p = this.currentPath();
    if (p === '/' || !p.trim()) return null;
    return this.getParentPath(p);
  });
  readonly canShowPreviousImage = computed(
    () => this.isImageViewerOpen() && this.viewerImageIndex() > 0 && this.viewerImagePaths().length > 1
  );
  readonly canShowNextImage = computed(
    () =>
      this.isImageViewerOpen() &&
      this.viewerImageIndex() >= 0 &&
      this.viewerImageIndex() < this.viewerImagePaths().length - 1
  );
  readonly canShowPreviousVideo = computed(
    () => this.isVideoViewerOpen() && this.viewerVideoIndex() > 0 && this.viewerVideoPaths().length > 1
  );
  readonly canShowNextVideo = computed(
    () =>
      this.isVideoViewerOpen() &&
      this.viewerVideoIndex() >= 0 &&
      this.viewerVideoIndex() < this.viewerVideoPaths().length - 1
  );

  constructor() {
    this.restoreState();

    const routePath = this.route.snapshot.queryParamMap.get('path');
    if (routePath) {
      this.currentPath.set(routePath);
    }

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const routePathParam = params.get('path');
      if (routePathParam && routePathParam !== this.currentPath()) {
        this.currentPath.set(routePathParam);
        this.page.set(1);
        this.searchFilters.set(null);
        this.persistState();
        this.refresh();
      }
    });

    this.syncRoutePath(false);

    this.destroyRef.onDestroy(() => {
      this.clearThumbnails();
      this.clearViewerImageUrl();
      this.clearViewerVideoUrl();
    });

    this.refresh();
  }

  refresh(): void {
    this.loadItems();

    this.explorerApi.tree({ path: '/', depth: 1, include_files: false, limit: 200 }).subscribe({
      next: (result) => {
        this.treeNodes.set(result.data.nodes);
        // Re-load children for all expanded paths after wiping the tree
        this.reloadExpandedChildren();
      },
      error: () => {},
    });
  }

  loadTreeChildren(path: string): void {
    this.explorerApi.tree({ path, depth: 1, include_files: false, limit: 200 }).subscribe({
      next: (result) => {
        const merged = this.attachChildren(this.treeNodes(), path, result.data.nodes);
        this.treeNodes.set(merged);
      },
      error: () => {},
    });
  }

  onExpandedPathsChange(paths: string[]): void {
    this.expandedTreePaths.set(paths);
    this.persistState();
  }

  navigateTo(path: string): void {
    this.updateCurrentPath(path, true);
  }

  goBackFolder(): void {
    const history = this.pathHistory();
    if (history.length === 0) {
      this.feedback.info('NAVIGATION', 'No hay carpeta anterior en el historial.');
      return;
    }

    const previousPath = history[history.length - 1];
    this.pathHistory.set(history.slice(0, -1));
    this.updateCurrentPath(previousPath, false);
  }

  goParentFolder(): void {
    const parent = this.getParentPath(this.currentPath());
    if (parent === this.currentPath()) {
      return;
    }
    this.updateCurrentPath(parent, true);
  }

  openItem(item: FileItem): void {
    if (this.isDirectoryItem(item)) {
      this.navigateTo(item.path);
      return;
    }

    if (this.isImageItem(item)) {
      this.openImageViewerFromPath(item.path);
      return;
    }

    if (this.isVideoItem(item)) {
      this.openVideoViewerFromPath(item.path);
      return;
    }

    this.filesApi.preview(item.path).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      error: () => {},
    });
  }

  runSearch(filters: SearchFilters): void {
    const hasFilters = Boolean(filters.q || filters.type || filters.ext);
    if (!hasFilters) {
      this.refresh();
      return;
    }

    this.page.set(1);
    this.searchFilters.set(filters);
    this.persistState();
    this.loadItems();
  }

  clearSearch(): void {
    this.searching.set(false);
    this.searchFilters.set(null);
    this.page.set(1);
    this.persistState();
    this.refresh();
  }

  changePage(offset: number): void {
    const nextPage = this.page() + offset;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.persistState();
    this.loadItems();
  }

  openCreateDirectoryModal(): void {
    this.openModal(
      {
        title: 'Nuevo directorio',
        label: 'Nombre del directorio',
        placeholder: 'mi-carpeta',
        confirmLabel: 'Crear',
      },
      (name) => {
        this.explorerApi.createDirectory(this.currentPath(), name).subscribe({
          next: () => {
            this.feedback.success('DIRECTORY_CREATED', `Directorio "${name}" creado.`);
            this.refresh();
          },
          error: () => {},
        });
      }
    );
  }

  uploadFiles(fileList: FileList): void {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    const entryIds = this.uploadTracker.startBatch(files);

    this.filesApi.uploadWithProgress(this.currentPath(), files, 'skip').subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadTracker.updateBatchProgress(
            entryIds,
            event.loaded ?? 0,
            event.total ?? files.reduce((s, f) => s + f.size, 0),
          );
          return;
        }

        if (event.type !== HttpEventType.Response || !event.body) {
          return;
        }

        const response = event.body.data as import('../../core/models/api.models').UploadResponse;

        const conflictNames = response.failed
          .filter((f) => f.reason.includes('CONFLICT') || f.reason.includes('target already exists'))
          .map((f) => f.name);

        const otherFailures = response.failed.filter(
          (f) => !f.reason.includes('CONFLICT') && !f.reason.includes('target already exists')
        );

        // Mark individual entries as done or error
        const failedNames = new Set(response.failed.map((f) => f.name));
        for (let i = 0; i < files.length; i++) {
          const failure = response.failed.find((f) => f.name === files[i].name);
          if (failure) {
            const isConflict = failure.reason.includes('CONFLICT') || failure.reason.includes('target already exists');
            if (!isConflict) {
              this.uploadTracker.markError(entryIds[i], failure.reason);
            } else {
              this.uploadTracker.markDone(entryIds[i]);
            }
          } else {
            this.uploadTracker.markDone(entryIds[i]);
          }
        }

        if (conflictNames.length > 0) {
          this.pendingConflictFiles = files.filter((f) => conflictNames.includes(f.name));
          this.firstRoundUploadedCount = response.uploaded.length;
          this.conflictingFileNames.set(conflictNames);
          this.isConflictModalOpen.set(true);

          if (otherFailures.length > 0) {
            this.feedback.warning(
              'UPLOAD',
              `${response.uploaded.length} subidos. ${otherFailures.length} fallaron por otros motivos.`
            );
          }
        } else {
          const totalFailed = response.failed.length;
          this.feedback.success(
            'UPLOAD',
            `Upload completado: ${response.uploaded.length} exitosos${
              totalFailed > 0 ? `, ${totalFailed} fallidos` : ''
            }.`
          );
          this.refresh();
        }
      },
      error: () => {
        this.uploadTracker.markBatchError(entryIds, 'Error de conexión');
      },
    });
  }

  onConflictResolve(policy: ConflictPolicy): void {
    this.isConflictModalOpen.set(false);
    const files = this.pendingConflictFiles;
    const firstRound = this.firstRoundUploadedCount;
    this.pendingConflictFiles = [];
    this.firstRoundUploadedCount = 0;
    this.conflictingFileNames.set([]);

    this.filesApi.upload(this.currentPath(), files, policy).subscribe({
      next: (response) => {
        const total = firstRound + response.uploaded.length;
        this.feedback.success(
          'UPLOAD',
          `Upload completado: ${total} exitosos${
            response.failed.length > 0 ? `, ${response.failed.length} fallidos` : ''
          }.`
        );
        this.refresh();
      },
      error: () => {},
    });
  }

  onConflictCancel(): void {
    const firstRound = this.firstRoundUploadedCount;
    this.isConflictModalOpen.set(false);
    this.pendingConflictFiles = [];
    this.firstRoundUploadedCount = 0;
    this.conflictingFileNames.set([]);

    if (firstRound > 0) {
      this.feedback.success('UPLOAD', `${firstRound} archivo(s) subidos. Conflictos omitidos.`);
    }
    this.refresh();
  }

  renameSelected(): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }

    const currentName = target.split('/').pop() ?? '';
    this.openModal(
      {
        title: 'Renombrar',
        label: 'Nuevo nombre',
        initialValue: currentName,
        confirmLabel: 'Renombrar',
      },
      (newName) => {
        // Preserve extension if the user accidentally removed it
        const currentExt = currentName.includes('.') ? currentName.split('.').pop() : '';
        const newExt = newName.includes('.') ? newName.split('.').pop() : '';
        const finalName = currentExt && !newExt ? `${newName}.${currentExt}` : newName;

        this.operationsApi.rename(target, finalName).subscribe({
          next: () => {
            this.feedback.success('RENAME', 'Elemento renombrado.');
            this.refresh();
          },
          error: () => {},
        });
      }
    );
  }

  moveSelected(): void {
    this.openModal(
      {
        title: 'Mover',
        label: 'Directorio destino',
        placeholder: '/carpeta-destino',
        confirmLabel: 'Mover',
      },
      (destination) => {
        this.operationsApi.move(this.selectedPaths(), destination, 'rename').subscribe({
          next: (response) => {
            this.feedback.success(
              'MOVE',
              `Move completado: ${response.moved.length} movidos, ${response.failed.length} fallidos.`
            );
            this.refresh();
          },
          error: () => {},
        });
      }
    );
  }

  copySelected(): void {
    this.openModal(
      {
        title: 'Copiar',
        label: 'Directorio destino',
        placeholder: '/carpeta-destino',
        confirmLabel: 'Copiar',
      },
      (destination) => {
        this.operationsApi.copy(this.selectedPaths(), destination, 'rename').subscribe({
          next: (response) => {
            this.feedback.success(
              'COPY',
              `Copy completado: ${response.copied.length} copiados, ${response.failed.length} fallidos.`
            );
            this.refresh();
          },
          error: () => {},
        });
      }
    );
  }

  deleteSelected(): void {
    this.operationsApi.delete(this.selectedPaths()).subscribe({
      next: (response) => {
        this.feedback.success(
          'DELETE',
          `Delete completado: ${response.deleted.length} eliminados, ${response.failed.length} fallidos.`
        );
        this.refresh();
      },
      error: () => {},
    });
  }

  restoreSelected(): void {
    this.operationsApi.restore(this.selectedPaths()).subscribe({
      next: (response) => {
        this.feedback.success(
          'RESTORE',
          `Restore completado: ${response.restored.length} restaurados, ${response.failed.length} fallidos.`
        );
        this.refresh();
      },
      error: () => {},
    });
  }

  downloadSelected(): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }

    this.filesApi.download(target).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = target.split('/').pop() ?? 'download';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {},
    });
  }

  showInfoSelected(): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }

    this.filesApi.info(target).subscribe({
      next: (info) => {
        this.feedback.info('INFO', `${info.name} | ${info.type} | ${info.size_human || info.size}`);
      },
      error: () => {},
    });
  }

  shareSelected(): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }

    this.sharingPath.set(target);
    this.sharesApi.create({ path: target }).subscribe({
      next: (share) => {
        const publicUrl = `${this.apiBaseUrl}${this.sharesApi.getPublicDownloadUrl(share.token)}`;
        navigator.clipboard.writeText(publicUrl).then(
          () => this.feedback.success('SHARE', `Enlace copiado al portapapeles para: ${target}`),
          () => this.feedback.success('SHARE', `Compartido: ${publicUrl}`)
        );
        this.sharingPath.set(null);
      },
      error: () => {
        this.sharingPath.set(null);
      },
    });
  }

  showItemInfo(path: string): void {
    this.filesApi.info(path).subscribe({
      next: (info) => {
        this.feedback.info(
          'INFO',
          `${info.name} | type=${info.type} | size=${info.size_human || info.size} | ext=${info.extension || '-'} | mime=${info.mime_type || '-'} | perms=${info.permissions || '-'} | modified=${info.modified_at} | created=${info.created_at}`
        );
      },
      error: () => {},
    });
  }

  openThumbnailSelected(): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }

    this.openImageViewerFromPath(target);
  }

  closeImageViewer(): void {
    this.isImageViewerOpen.set(false);
    this.clearViewerImageUrl();
    this.viewerImageIndex.set(-1);
    this.viewerImagePaths.set([]);
  }

  closeVideoViewer(): void {
    this.isVideoViewerOpen.set(false);
    this.clearViewerVideoUrl();
    this.viewerVideoIndex.set(-1);
    this.viewerVideoPaths.set([]);
  }

  showPreviousImage(): void {
    const previousIndex = this.viewerImageIndex() - 1;
    if (previousIndex < 0) {
      return;
    }

    this.loadViewerImageByIndex(previousIndex);
  }

  showNextImage(): void {
    const nextIndex = this.viewerImageIndex() + 1;
    if (nextIndex >= this.viewerImagePaths().length) {
      return;
    }

    this.loadViewerImageByIndex(nextIndex);
  }

  showPreviousVideo(): void {
    const previousIndex = this.viewerVideoIndex() - 1;
    if (previousIndex < 0) {
      return;
    }

    this.loadViewerVideoByIndex(previousIndex);
  }

  showNextVideo(): void {
    const nextIndex = this.viewerVideoIndex() + 1;
    if (nextIndex >= this.viewerVideoPaths().length) {
      return;
    }

    this.loadViewerVideoByIndex(nextIndex);
  }

  handleMoveItems(event: { sources: string[]; destination: string }): void {
    this.operationsApi.move(event.sources, event.destination, 'rename').subscribe({
      next: () => {
        this.selectedPaths.set([]);
        this.feedback.info('MOVE', `${event.sources.length} elemento(s) movido(s) correctamente.`);
        this.refresh();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al mover elementos.';
        this.feedback.error('MOVE', msg);
      },
    });
  }

  onSelectionChange(paths: string[]): void {
    this.selectedPaths.set(paths);
    this.suppressDetailsForPath.set(null);
  }

  openContextMenu(eventData: { event: MouseEvent; item: FileItem }): void {
    const { event, item } = eventData;
    this.suppressDetailsForPath.set(item.path);

    // If the item is not already selected, select only this item
    if (!this.selectedPaths().includes(item.path)) {
      this.selectedPaths.set([item.path]);
    }

    this.contextMenuX.set(event.clientX);
    this.contextMenuY.set(event.clientY);
    this.isContextMenuOpen.set(true);
  }

  closeContextMenu(): void {
    this.isContextMenuOpen.set(false);
  }

  onModalConfirm(value: string): void {
    this.pendingModalAction?.(value);
    this.pendingModalAction = null;
    this.activeModal.set(null);
  }

  onModalCancel(): void {
    this.pendingModalAction = null;
    this.activeModal.set(null);
  }

  handleContextMenuAction(action: ContextMenuAction): void {
    switch (action) {
      case 'rename':
        this.renameSelected();
        break;
      case 'move':
        this.moveSelected();
        break;
      case 'copy':
        this.copySelected();
        break;
      case 'delete':
        this.deleteSelected();
        break;
      case 'download':
        this.downloadSelected();
        break;
      case 'info':
        this.showInfoSelected();
        break;
      case 'share':
        this.shareSelected();
        break;
    }
  }

  private loadItems(): void {
    const filters = this.searchFilters();

    if (filters && (filters.q || filters.type || filters.ext)) {
      this.searching.set(true);
      this.searchApi
        .search({
          q: filters.q,
          path: this.currentPath(),
          type: filters.type,
          ext: filters.ext,
          page: this.page(),
          limit: this.limit(),
        })
        .subscribe({
          next: (result) => {
            this.searching.set(false);
            const sortedItems = this.sortItemsForDisplay(result.data.items);
            this.items.set(sortedItems);
            this.loadThumbnails(sortedItems);
            this.selectedPaths.set([]);
            this.totalPages.set(result.meta?.total_pages ?? 1);
            this.totalItems.set(result.meta?.total ?? result.data.items.length);
          },
          error: () => {
            this.searching.set(false);
          },
        });

      return;
    }

    this.explorerApi
      .list({ path: this.currentPath(), page: this.page(), limit: this.limit() })
      .subscribe({
        next: (result) => {
          const sortedItems = this.sortItemsForDisplay(result.data.items);
          this.items.set(sortedItems);
          this.loadThumbnails(sortedItems);
          this.selectedPaths.set([]);
          this.totalPages.set(result.meta?.total_pages ?? 1);
          this.totalItems.set(result.meta?.total ?? result.data.items.length);
        },
        error: () => {},
      });
  }

  private sortItemsForDisplay(items: FileItem[]): FileItem[] {
    return [...items].sort((left, right) => {
      const leftIsDirectory = this.isDirectoryItem(left);
      const rightIsDirectory = this.isDirectoryItem(right);

      if (leftIsDirectory !== rightIsDirectory) {
        return leftIsDirectory ? -1 : 1;
      }

      return left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true });
    });
  }

  private attachChildren(nodes: TreeNode[], targetPath: string, children: TreeNode[]): TreeNode[] {
    return nodes.map((node) => {
      if (node.path === targetPath) {
        return {
          ...node,
          children,
        };
      }

      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: this.attachChildren(node.children, targetPath, children),
        };
      }

      return node;
    });
  }

  private loadThumbnails(items: FileItem[]): void {
    this.clearThumbnails();

    const urls: Record<string, string> = {};

    for (const item of items) {
      if (!this.isImageItem(item) && !this.isVideoItem(item)) {
        continue;
      }

      urls[item.path] = this.filesApi.thumbnailDirectUrl(item.path, 512);
    }

    this.thumbnailUrls.set(urls);
  }

  private isImageItem(item: FileItem): boolean {
    if (this.isDirectoryItem(item)) {
      return false;
    }

    if (item.is_image === true) {
      return true;
    }

    return item.mime_type?.startsWith('image/') ?? false;
  }

  private isVideoItem(item: FileItem): boolean {
    if (this.isDirectoryItem(item)) {
      return false;
    }

    if (item.is_video === true) {
      return true;
    }

    return item.mime_type?.startsWith('video/') ?? false;
  }

  private isDirectoryItem(item: FileItem): boolean {
    const normalizedType = item.type.trim().toLowerCase();
    return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
  }

  private clearThumbnails(): void {
    this.thumbnailUrls.set({});
  }

  private openImageViewer(objectUrl: string, imageName: string): void {
    this.closeVideoViewer();
    this.clearViewerImageUrl();
    this.viewerImageUrl.set(objectUrl);
    this.viewerImageName.set(imageName);
    this.isImageViewerOpen.set(true);
  }

  private openVideoViewer(objectUrl: string, videoName: string): void {
    this.closeImageViewer();
    this.clearViewerVideoUrl();
    this.viewerVideoUrl.set(objectUrl);
    this.viewerVideoName.set(videoName);
    this.isVideoViewerOpen.set(true);
  }

  private openImageViewerFromPath(path: string): void {
    const imageItems = this.items().filter((item) => this.isImageItem(item));
    const imagePaths = imageItems.map((item) => item.path);

    if (imagePaths.length === 0) {
      this.feedback.warning('VIEWER', 'No hay imágenes en la vista actual.');
      return;
    }

    const targetIndex = imagePaths.indexOf(path);
    if (targetIndex === -1) {
      this.feedback.warning('VIEWER', 'La imagen seleccionada no está disponible en la página actual.');
      return;
    }

    this.viewerImagePaths.set(imagePaths);
    this.loadViewerImageByIndex(targetIndex);
  }

  private loadViewerImageByIndex(index: number): void {
    const paths = this.viewerImagePaths();
    const targetPath = paths[index];
    if (!targetPath) {
      return;
    }

    this.filesApi.preview(targetPath).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const item = this.items().find((entry) => entry.path === targetPath);
        const imageName = item?.name ?? targetPath.split('/').pop() ?? 'Imagen';

        this.viewerImageIndex.set(index);
        this.openImageViewer(objectUrl, imageName);
      },
      error: () => {},
    });
  }

  private openVideoViewerFromPath(path: string): void {
    const videoItems = this.items().filter((item) => this.isVideoItem(item));
    const videoPaths = videoItems.map((item) => item.path);

    if (videoPaths.length === 0) {
      this.feedback.warning('VIEWER', 'No hay videos en la vista actual.');
      return;
    }

    const targetIndex = videoPaths.indexOf(path);
    if (targetIndex === -1) {
      this.feedback.warning('VIEWER', 'El video seleccionado no está disponible en la página actual.');
      return;
    }

    this.viewerVideoPaths.set(videoPaths);
    this.loadViewerVideoByIndex(targetIndex);
  }

  private loadViewerVideoByIndex(index: number): void {
    const paths = this.viewerVideoPaths();
    const targetPath = paths[index];
    if (!targetPath) {
      return;
    }

    // Use a direct URL so the browser <video> element can send Range requests
    // (HTTP 206 Partial Content) instead of downloading the entire file.
    const directUrl = this.filesApi.streamUrl(targetPath);
    const item = this.items().find((entry) => entry.path === targetPath);
    const videoName = item?.name ?? targetPath.split('/').pop() ?? 'Video';

    this.viewerVideoIndex.set(index);
    this.openVideoViewer(directUrl, videoName);
  }

  private clearViewerImageUrl(): void {
    const current = this.viewerImageUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.viewerImageUrl.set(null);
  }

  private clearViewerVideoUrl(): void {
    this.viewerVideoUrl.set(null);
  }

  private updateCurrentPath(path: string, pushHistory: boolean): void {
    const normalizedPath = path.trim() || '/';
    if (normalizedPath === this.currentPath()) {
      return;
    }

    if (pushHistory) {
      this.pathHistory.update((history) => [...history, this.currentPath()].slice(-50));
    }

    this.currentPath.set(normalizedPath);
    this.page.set(1);
    this.searchFilters.set(null);
    this.persistState();
    this.syncRoutePath(true);
    this.autoExpandToPath(normalizedPath);
    this.refresh();
  }

  private getParentPath(path: string): string {
    if (path === '/' || !path.trim()) {
      return '/';
    }

    const segments = path.split('/').filter((segment) => segment.length > 0);
    if (segments.length <= 1) {
      return '/';
    }

    segments.pop();
    return `/${segments.join('/')}`;
  }

  private syncRoutePath(pushHistory: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        path: this.currentPath(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: !pushHistory,
    });
  }

  /** Expand all ancestor folders of `path` in the tree and lazy-load missing children. */
  private autoExpandToPath(path: string): void {
    if (!path || path === '/') {
      return;
    }

    const segments = path.split('/').filter((s) => s.length > 0);
    const ancestors: string[] = [];
    let accumulated = '';
    for (const segment of segments) {
      accumulated += '/' + segment;
      // Include the path itself so it gets expanded too (useful when navigating to a dir)
      ancestors.push(accumulated);
    }

    // Merge with existing expanded paths (dedup)
    const existing = this.expandedTreePaths();
    const merged = [...new Set([...existing, ...ancestors])];
    this.expandedTreePaths.set(merged);
    this.persistState();

    // Load missing children sequentially (sorted by depth) so that parent nodes are
    // fetched before their children, avoiding "node not found" failures on deep paths.
    this.reloadExpandedChildren();
  }

  /**
   * For every path in `expandedTreePaths` whose node exists in the tree but has no
   * loaded children yet, fetch those children.  Paths are processed depth-first so a
   * parent is always fetched before we try to find its children.
   */
  private reloadExpandedChildren(): void {
    const expandedPaths = this.expandedTreePaths();
    if (expandedPaths.length === 0) {
      return;
    }

    // Sort shallowest first so parents are available when children are looked up
    const sorted = [...expandedPaths].sort(
      (a, b) => a.split('/').filter(Boolean).length - b.split('/').filter(Boolean).length
    );

    this.loadChildrenSequentially(sorted);
  }

  /**
   * Walk the list one-by-one, awaiting each API response before moving to the next,
   * so that a newly loaded parent's children are already in `treeNodes` when we try
   * to locate deeper descendants.
   */
  private loadChildrenSequentially(paths: string[]): void {
    if (paths.length === 0) {
      return;
    }

    const [current, ...remaining] = paths;
    const node = this.findTreeNode(this.treeNodes(), current);

    if (node && node.has_children && (!node.children || node.children.length === 0)) {
      this.explorerApi.tree({ path: current, depth: 1, include_files: false, limit: 200 }).subscribe({
        next: (result) => {
          const merged = this.attachChildren(this.treeNodes(), current, result.data.nodes);
          this.treeNodes.set(merged);
          this.loadChildrenSequentially(remaining);
        },
        error: () => this.loadChildrenSequentially(remaining),
      });
    } else {
      this.loadChildrenSequentially(remaining);
    }
  }

  private findTreeNode(nodes: TreeNode[], targetPath: string): TreeNode | null {
    for (const node of nodes) {
      if (node.path === targetPath) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findTreeNode(node.children, targetPath);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private openModal(config: ActiveModalConfig, action: (value: string) => void): void {
    this.pendingModalAction = action;
    this.activeModal.set(config);
  }

  private persistState(): void {
    const state: ExplorerUiState = {
      currentPath: this.currentPath(),
      page: this.page(),
      limit: this.limit(),
      searchFilters: this.searchFilters(),
      pathHistory: this.pathHistory(),
      expandedTreePaths: this.expandedTreePaths(),
    };

    sessionStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private restoreState(): void {
    const rawState = sessionStorage.getItem(this.storageKey);
    if (!rawState) {
      return;
    }

    try {
      const state = JSON.parse(rawState) as ExplorerUiState;
      this.currentPath.set(state.currentPath || '/');
      this.page.set(state.page || 1);
      this.limit.set(state.limit || 50);
      this.searchFilters.set(state.searchFilters ?? null);
      this.pathHistory.set(Array.isArray(state.pathHistory) ? state.pathHistory : []);
      this.expandedTreePaths.set(Array.isArray(state.expandedTreePaths) ? state.expandedTreePaths : []);
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }
  }
}
