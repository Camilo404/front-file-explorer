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
    <section class="rounded border border-slate-800 bg-slate-900 p-3">
      <header class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-semibold">Árbol</h2>
      </header>

      <div class="max-h-[70vh] overflow-auto">
        <!-- Root entry -->
        <div class="mb-1">
          <button
            type="button"
            class="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-slate-800"
            [class.bg-slate-800]="currentPath() === '/'"
            [class.font-semibold]="currentPath() === '/'"
            aria-label="Ir a la raíz"
            (click)="selectPath.emit('/')"
          >
            <span aria-hidden="true">🏠</span>
            <span class="truncate text-slate-200">/ (raíz)</span>
          </button>
        </div>

        @if (nodes().length === 0) {
          <p class="text-sm text-slate-400">Sin nodos.</p>
        } @else {
          <ul class="space-y-1 text-sm">
            @for (row of visibleRows(); track row.node.path) {
              <li>
                <div class="flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800" [style.padding-left.px]="row.level * 16 + 8">
                  @if (isDirectory(row.node.type) && canExpand(row.node)) {
                    <button
                      type="button"
                      class="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      [attr.aria-label]="isExpanded(row.node.path) ? 'Collapse' : 'Expand'"
                      (click)="$event.stopPropagation(); toggleExpand(row.node)"
                    >
                      {{ isExpanded(row.node.path) ? '▾' : '▸' }}
                    </button>
                  } @else {
                    <span class="inline-block h-5 w-5"></span>
                  }

                  <button
                    type="button"
                    class="flex-1 truncate rounded px-1 py-0.5 text-left hover:bg-slate-700"
                    [class.bg-slate-700]="currentPath() === row.node.path"
                    [class.font-medium]="currentPath() === row.node.path"
                    [class.text-white]="currentPath() === row.node.path"
                    (click)="activateNode(row.node)"
                  >
                    {{ isDirectory(row.node.type) ? '📁' : '📄' }} {{ row.node.name }}
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
