import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ExplorerApiService } from '../../core/api/explorer-api.service';
import { FilesApiService } from '../../core/api/files-api.service';
import { ConflictPolicy, OperationsApiService } from '../../core/api/operations-api.service';
import { SearchApiService } from '../../core/api/search-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { FileItem, TreeNode } from '../../core/models/api.models';
import { FileListComponent } from './components/file-list.component';
import { ImageViewerComponent } from './components/image-viewer.component';
import { OperationPayload, OperationsPanelComponent } from './components/operations-panel.component';
import { SearchFilters, SearchPanelComponent } from './components/search-panel.component';
import { TreePanelComponent } from './components/tree-panel.component';

interface ExplorerUiState {
  currentPath: string;
  page: number;
  limit: number;
  searchFilters: SearchFilters | null;
  createDirectoryName: string;
  uploadConflictPolicy: ConflictPolicy;
  pathHistory: string[];
  expandedTreePaths: string[];
}

interface BreadcrumbItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-explorer-page',
  imports: [SearchPanelComponent, TreePanelComponent, FileListComponent, OperationsPanelComponent, ImageViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <div class="flex flex-wrap items-center gap-2 rounded border border-slate-800 bg-slate-900 p-3">
        <span class="text-xs text-slate-400">Path actual: {{ currentPath() }}</span>
        <button
          type="button"
          class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
          [disabled]="pathHistory().length === 0"
          (click)="goBackFolder()"
        >
          Back Folder
        </button>
        <button
          type="button"
          class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
          [disabled]="currentPath() === '/'"
          (click)="goParentFolder()"
        >
          Parent Folder
        </button>
        <button type="button" class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" (click)="refresh()">Refresh</button>
        <input
          type="text"
          [value]="createDirectoryName()"
          placeholder="Nuevo directorio"
          class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
          (input)="onDirectoryNameInput($event)"
        />
        <button type="button" class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" (click)="createDirectory()">Create Dir</button>
        <button type="button" class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" (click)="downloadSelected()" [disabled]="selectedPaths().length !== 1">Download</button>
        <button type="button" class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" (click)="showInfoSelected()" [disabled]="selectedPaths().length !== 1">Info</button>
        <button type="button" class="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" (click)="openThumbnailSelected()" [disabled]="selectedPaths().length !== 1">Thumbnail</button>
        <select
          [value]="uploadConflictPolicy()"
          class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
          (change)="setUploadConflictPolicy($event)"
        >
          <option value="rename">upload: rename</option>
          <option value="overwrite">upload: overwrite</option>
          <option value="skip">upload: skip</option>
        </select>
        <label class="rounded bg-blue-700 px-2 py-1 text-xs hover:bg-blue-600">
          Upload
          <input type="file" class="hidden" multiple (change)="uploadFiles($event)" />
        </label>
      </div>

      <nav class="flex flex-wrap items-center gap-1 rounded border border-slate-800 bg-slate-900 px-3 py-2 text-xs">
        @for (crumb of breadcrumbs(); track crumb.path) {
          <button
            type="button"
            class="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
            [class.bg-blue-700]="crumb.path === currentPath()"
            (click)="navigateTo(crumb.path)"
          >
            {{ crumb.label }}
          </button>
          @if (!$last) {
            <span class="text-slate-500">/</span>
          }
        }
      </nav>

      <app-operations-panel
        [selectedCount]="selectedCount()"
        (refresh)="refresh()"
        (rename)="renameSelected($event)"
        (move)="moveSelected($event)"
        (copy)="copySelected($event)"
        (delete)="deleteSelected()"
        (restore)="restoreSelected()"
      />

      <app-search-panel (search)="runSearch($event)" (clearFilters)="clearSearch()" />

      <div class="flex items-center justify-between rounded border border-slate-800 bg-slate-900 px-3 py-2 text-xs">
        <span class="text-slate-400">
          Modo: {{ searchFilters() ? 'search' : 'list' }} | Página {{ page() }}/{{ totalPages() }} | Total {{ totalItems() }}
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
            [disabled]="page() <= 1"
            (click)="changePage(-1)"
          >
            Prev
          </button>
          <button
            type="button"
            class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
            [disabled]="page() >= totalPages()"
            (click)="changePage(1)"
          >
            Next
          </button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-[320px_1fr]">
        <app-tree-panel
          [nodes]="treeNodes()"
          [currentPath]="currentPath()"
          [expandedPaths]="expandedTreePaths()"
          (selectPath)="navigateTo($event)"
          (loadChildren)="loadTreeChildren($event)"
          (expandedPathsChange)="onExpandedPathsChange($event)"
        />

        <app-file-list
          [items]="items()"
          [selectedPaths]="selectedPaths()"
          [thumbnailUrls]="thumbnailUrls()"
          (open)="openItem($event)"
          (toggleSelection)="toggleSelection($event)"
          (info)="showItemInfo($event)"
        />
      </div>

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
    </section>
  `,
})
export class ExplorerPage {
  private readonly explorerApi = inject(ExplorerApiService);
  private readonly searchApi = inject(SearchApiService);
  private readonly filesApi = inject(FilesApiService);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly feedback = inject(ErrorStoreService);
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
  readonly selectedPaths = signal<string[]>([]);
  readonly searching = signal(false);
  readonly createDirectoryName = signal('');
  readonly uploadConflictPolicy = signal<ConflictPolicy>('rename');
  readonly page = signal(1);
  readonly limit = signal(50);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly searchFilters = signal<SearchFilters | null>(null);

  readonly selectedCount = computed(() => this.selectedPaths().length);
  readonly canShowPreviousImage = computed(
    () => this.isImageViewerOpen() && this.viewerImageIndex() > 0 && this.viewerImagePaths().length > 1
  );
  readonly canShowNextImage = computed(
    () =>
      this.isImageViewerOpen() &&
      this.viewerImageIndex() >= 0 &&
      this.viewerImageIndex() < this.viewerImagePaths().length - 1
  );
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const path = this.currentPath();
    const segments = path.split('/').filter((segment) => segment.length > 0);

    const crumbs: BreadcrumbItem[] = [{ label: 'root', path: '/' }];
    let accumulated = '';

    for (const segment of segments) {
      accumulated = `${accumulated}/${segment}`;
      crumbs.push({
        label: segment,
        path: accumulated,
      });
    }

    return crumbs;
  });

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
    });

    this.refresh();
  }

  refresh(): void {
    this.loadItems();

    this.explorerApi.tree({ path: '/', depth: 1, include_files: false, limit: 200 }).subscribe({
      next: (result) => this.treeNodes.set(result.data.nodes),
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

    this.filesApi.preview(item.path).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      error: () => {},
    });
  }

  toggleSelection(path: string): void {
    this.selectedPaths.update((current) =>
      current.includes(path) ? current.filter((value) => value !== path) : [...current, path]
    );
  }

  runSearch(filters: SearchFilters): void {
    if (!filters.q) {
      this.refresh();
      return;
    }

    this.page.set(1);
    this.searchFilters.set(filters);
    this.feedback.info('SEARCH', `Buscando "${filters.q}"`);
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

  createDirectory(): void {
    const name = this.createDirectoryName().trim();
    if (!name) {
      this.feedback.warning('DIRECTORY', 'Ingresa el nombre del directorio.');
      return;
    }

    this.explorerApi.createDirectory(this.currentPath(), name).subscribe({
      next: () => {
        this.feedback.success('DIRECTORY_CREATED', `Directorio "${name}" creado.`);
        this.createDirectoryName.set('');
        this.persistState();
        this.refresh();
      },
      error: () => {},
    });
  }

  uploadFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fileList = input.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    this.filesApi.upload(this.currentPath(), files, this.uploadConflictPolicy()).subscribe({
      next: (response) => {
        this.feedback.success(
          'UPLOAD',
          `Upload completado: ${response.uploaded.length} exitosos, ${response.failed.length} fallidos.`
        );
        this.refresh();
      },
      error: () => {},
    });
  }

  onDirectoryNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createDirectoryName.set(input.value);
    this.persistState();
  }

  setUploadConflictPolicy(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value === 'rename' || select.value === 'overwrite' || select.value === 'skip') {
      this.uploadConflictPolicy.set(select.value);
      this.persistState();
    }
  }

  renameSelected(newName: string): void {
    const target = this.selectedPaths()[0];
    if (!target) {
      return;
    }
    const trimmedName = newName.trim();
    if (!trimmedName) {
      this.feedback.warning('RENAME', 'Ingresa un nuevo nombre para renombrar.');
      return;
    }

    this.operationsApi.rename(target, trimmedName).subscribe({
      next: () => {
        this.feedback.success('RENAME', 'Elemento renombrado.');
        this.refresh();
      },
      error: () => {},
    });
  }

  moveSelected(payload: OperationPayload): void {
    if (!payload.destination) {
      this.feedback.warning('MOVE', 'Ingresa destino para mover.');
      return;
    }

    this.operationsApi.move(this.selectedPaths(), payload.destination, payload.conflictPolicy).subscribe({
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

  copySelected(payload: OperationPayload): void {
    if (!payload.destination) {
      this.feedback.warning('COPY', 'Ingresa destino para copiar.');
      return;
    }

    this.operationsApi.copy(this.selectedPaths(), payload.destination, payload.conflictPolicy).subscribe({
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

  private loadItems(): void {
    const filters = this.searchFilters();

    if (filters?.q) {
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

    for (const item of items) {
      if (!this.isImageItem(item)) {
        continue;
      }

      this.filesApi.thumbnail(item.path, 64).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.thumbnailUrls.update((current) => ({
            ...current,
            [item.path]: objectUrl,
          }));
        },
        error: () => {},
      });
    }
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

  private isDirectoryItem(item: FileItem): boolean {
    const normalizedType = item.type.trim().toLowerCase();
    return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
  }

  private clearThumbnails(): void {
    const currentThumbnails = this.thumbnailUrls();
    for (const path of Object.keys(currentThumbnails)) {
      URL.revokeObjectURL(currentThumbnails[path]);
    }
    this.thumbnailUrls.set({});
  }

  private openImageViewer(objectUrl: string, imageName: string): void {
    this.clearViewerImageUrl();
    this.viewerImageUrl.set(objectUrl);
    this.viewerImageName.set(imageName);
    this.isImageViewerOpen.set(true);
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

  private clearViewerImageUrl(): void {
    const current = this.viewerImageUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.viewerImageUrl.set(null);
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
    for (let i = 0; i < segments.length; i++) {
      accumulated += '/' + segments[i];
      // Include the path itself so it gets expanded too (useful when navigating to a dir)
      ancestors.push(accumulated);
    }

    // Merge with existing expanded paths (dedup)
    const existing = this.expandedTreePaths();
    const merged = [...new Set([...existing, ...ancestors])];
    this.expandedTreePaths.set(merged);
    this.persistState();

    // Lazy-load children for ancestors that exist in the tree but haven't been fetched yet
    for (const ancestor of ancestors) {
      const node = this.findTreeNode(this.treeNodes(), ancestor);
      if (node && node.has_children && (!node.children || node.children.length === 0)) {
        this.loadTreeChildren(ancestor);
      }
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

  private persistState(): void {
    const state: ExplorerUiState = {
      currentPath: this.currentPath(),
      page: this.page(),
      limit: this.limit(),
      searchFilters: this.searchFilters(),
      createDirectoryName: this.createDirectoryName(),
      uploadConflictPolicy: this.uploadConflictPolicy(),
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
      this.createDirectoryName.set(state.createDirectoryName ?? '');
      this.uploadConflictPolicy.set(state.uploadConflictPolicy ?? 'rename');
      this.pathHistory.set(Array.isArray(state.pathHistory) ? state.pathHistory : []);
      this.expandedTreePaths.set(Array.isArray(state.expandedTreePaths) ? state.expandedTreePaths : []);
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }
  }
}
