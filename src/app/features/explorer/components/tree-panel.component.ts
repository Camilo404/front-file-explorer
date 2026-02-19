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
    <section class="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
      <header class="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-folder-tree text-sky-400"></i>
          <h2 class="text-sm font-semibold text-slate-200">Explorador</h2>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <!-- Root entry -->
        <div class="mb-2">
          <button
            type="button"
            class="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-white/10"
            [class.bg-sky-500/20]="currentPath() === '/'"
            [class.text-sky-300]="currentPath() === '/'"
            [class.text-slate-300]="currentPath() !== '/'"
            aria-label="Ir a la raíz"
            (click)="selectPath.emit('/')"
          >
            <i class="fa-solid fa-hard-drive shrink-0 transition-transform group-hover:scale-110" [class.text-sky-400]="currentPath() === '/'" [class.text-slate-400]="currentPath() !== '/'"></i>
            <span class="truncate font-medium">Raíz del sistema</span>
          </button>
        </div>

        @if (nodes().length === 0) {
          <div class="flex flex-col items-center justify-center py-8 text-center opacity-50">
            <i class="fa-solid fa-folder-open mb-2 text-4xl text-slate-400"></i>
            <p class="text-xs text-slate-400">Carpeta vacía</p>
          </div>
        } @else {
          <ul class="space-y-0.5 text-sm">
            @for (row of visibleRows(); track row.node.path) {
              <li>
                <div class="group flex items-center rounded-lg transition-colors hover:bg-white/5" 
                     [class.bg-sky-500/10]="currentPath() === row.node.path"
                     [style.padding-left.px]="row.level * 12 + 4">
                  
                  <div class="flex h-8 w-6 shrink-0 items-center justify-center">
                    @if (isDirectory(row.node.type) && canExpand(row.node)) {
                      <button
                        type="button"
                        class="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10"
                        [attr.aria-label]="isExpanded(row.node.path) ? 'Collapse' : 'Expand'"
                        (click)="$event.stopPropagation(); toggleExpand(row.node)"
                      >
                        <i class="fa-solid fa-chevron-right transition-transform duration-200" [class.rotate-90]="isExpanded(row.node.path)"></i>
                      </button>
                    }
                  </div>

                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-3 text-left transition-colors"
                    [class.text-sky-300]="currentPath() === row.node.path"
                    [class.font-medium]="currentPath() === row.node.path"
                    [class.text-slate-300]="currentPath() !== row.node.path"
                    (click)="activateNode(row.node)"
                  >
                    @if (isDirectory(row.node.type)) {
                      <i class="fa-solid fa-folder shrink-0 transition-transform group-hover:scale-110" [class.text-sky-400]="currentPath() === row.node.path" [class.text-slate-400]="currentPath() !== row.node.path" [class.fa-folder-open]="isExpanded(row.node.path)"></i>
                    } @else {
                      <i class="fa-solid fa-file shrink-0 text-slate-500 transition-transform group-hover:scale-110"></i>
                    }
                    <span class="truncate">{{ row.node.name }}</span>
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
  readonly selectPath = output<string>();
  readonly loadChildren = output<string>();
  readonly expandedPathsChange = output<string[]>();

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
