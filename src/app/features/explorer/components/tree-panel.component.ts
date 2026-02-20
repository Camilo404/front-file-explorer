import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TreeNode } from '../../../core/models/api.models';

interface TreeRow {
  node: TreeNode;
  level: number;
}

@Component({
  selector: 'app-tree-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 shadow-2xl backdrop-blur-xl">
      <header class="flex shrink-0 items-center justify-between px-6 py-5">
        <div class="flex items-center gap-3">
          <div class="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20">
            <i class="fa-solid fa-folder-tree text-sm"></i>
          </div>
          <h2 class="text-base font-semibold tracking-tight text-zinc-100">Explorador</h2>
        </div>
        @if (closeable()) {
          <button
            type="button"
            class="lg:hidden flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            aria-label="Cerrar panel"
            (click)="close.emit()"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        }
      </header>

      <div class="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        <!-- Root entry -->
        <div class="mb-4">
          <button
            type="button"
            class="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all hover:bg-white/5"
            [class.bg-violet-500/10]="currentPath() === '/'"
            [class.text-violet-300]="currentPath() === '/'"
            [class.text-zinc-400]="currentPath() !== '/'"
            aria-label="Ir a la raíz"
            (click)="selectPath.emit('/')"
          >
            @if (currentPath() === '/') {
              <div class="absolute left-0 h-3/4 w-1 rounded-r-full bg-violet-500"></div>
            }
            <i class="fa-solid fa-hard-drive shrink-0 transition-colors" [class.text-violet-400]="currentPath() === '/'" [class.text-zinc-500]="currentPath() !== '/'"></i>
            <span class="truncate font-medium transition-colors group-hover:text-zinc-200">Raíz del sistema</span>
          </button>
        </div>

        @if (nodes().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-800/50">
              <i class="fa-solid fa-folder-open text-xl text-zinc-600"></i>
            </div>
            <p class="text-sm font-medium text-zinc-500">Sin directorios</p>
          </div>
        } @else {
          <ul class="space-y-0.5 text-sm">
            @for (row of visibleRows(); track row.node.path) {
              <li>
                <div 
                  class="group relative flex items-center rounded-lg transition-colors hover:bg-white/5" 
                  [class.bg-violet-500/10]="currentPath() === row.node.path"
                  [style.padding-left.px]="row.level * 16 + 8"
                >
                  @if (currentPath() === row.node.path) {
                    <div class="absolute left-0 h-3/4 w-1 rounded-r-full bg-violet-500"></div>
                  }
                  
                  <div class="flex h-9 w-6 shrink-0 items-center justify-center">
                    @if (isDirectory(row.node.type) && canExpand(row.node)) {
                      <button
                        type="button"
                        class="flex size-5 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-300"
                        [attr.aria-label]="isExpanded(row.node.path) ? 'Collapse' : 'Expand'"
                        (click)="$event.stopPropagation(); toggleExpand(row.node)"
                      >
                        <i class="fa-solid fa-chevron-right text-[10px] transition-transform duration-200" [class.rotate-90]="isExpanded(row.node.path)"></i>
                      </button>
                    }
                  </div>

                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-3 text-left transition-colors"
                    [class.text-violet-300]="currentPath() === row.node.path"
                    [class.font-medium]="currentPath() === row.node.path"
                    [class.text-zinc-400]="currentPath() !== row.node.path"
                    (click)="activateNode(row.node)"
                  >
                    @if (isDirectory(row.node.type)) {
                      <i 
                        class="fa-solid shrink-0 transition-colors" 
                        [class.fa-folder]="!isExpanded(row.node.path)"
                        [class.fa-folder-open]="isExpanded(row.node.path)"
                        [class.text-violet-400]="currentPath() === row.node.path || isExpanded(row.node.path)"
                        [class.text-zinc-500]="currentPath() !== row.node.path && !isExpanded(row.node.path)"
                      ></i>
                    } @else {
                      <i class="fa-solid fa-file shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-500"></i>
                    }
                    <span class="truncate transition-colors group-hover:text-zinc-200">{{ row.node.name }}</span>
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class TreePanelComponent {
  readonly nodes = input<TreeNode[]>([]);
  readonly currentPath = input('/');
  readonly expandedPaths = input<string[]>([]);
  readonly closeable = input<boolean>(false);
  readonly selectPath = output<string>();
  readonly loadChildren = output<string>();
  readonly expandedPathsChange = output<string[]>();
  readonly close = output<void>();

  readonly visibleRows = computed<TreeRow[]>(() => {
    const rows: TreeRow[] = [];

    const visit = (nodes: TreeNode[], level: number): void => {
      for (const node of nodes) {
        rows.push({ node, level });

        if (this.isDirectory(node.type) && this.isExpanded(node.path) && node.children && node.children.length > 0) {
          visit(node.children, level + 1);
        }
      }
    };

    visit(this.nodes(), 0);
    return rows;
  });

  isDirectory(type: string): boolean {
    const normalized = type.trim().toLowerCase();
    return normalized === 'dir' || normalized === 'directory' || normalized === 'folder';
  }

  /** Only show the expand chevron if there are children to show or load. */
  canExpand(node: TreeNode): boolean {
    return node.has_children || !!(node.children && node.children.length > 0);
  }

  isExpanded(path: string): boolean {
    return this.expandedPaths().includes(path);
  }

  /**
   * Clicking a folder name navigates to it AND expands it (if not already open).
   * Clicking a file just navigates.
   */
  activateNode(node: TreeNode): void {
    this.selectPath.emit(node.path);
    if (this.isDirectory(node.type) && !this.isExpanded(node.path)) {
      this.toggleExpand(node);
    }
  }

  toggleExpand(node: TreeNode): void {
    if (!this.isDirectory(node.type)) {
      return;
    }

    const path = node.path;
    const isOpen = this.isExpanded(path);

    const current = this.expandedPaths();
    const next = isOpen ? current.filter((value) => value !== path) : [...current, path];
    this.expandedPathsChange.emit(next);

    if (!isOpen && node.has_children && (!node.children || node.children.length === 0)) {
      this.loadChildren.emit(path);
    }
  }
}
