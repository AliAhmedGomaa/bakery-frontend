import {
  Component,
  ContentChild,
  TemplateRef,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { GmnInputComponent } from '../gmn-input/gmn-input.component';
import { AR } from '../../../core/i18n/ar';

export interface GmnTableColumn {
  key: string;
  label: string;
  sticky?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** When false, this column is skipped by the built-in search. */
  searchable?: boolean;
}

@Component({
  selector: 'gmn-table',
  standalone: true,
  imports: [NgTemplateOutlet, GmnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (searchable()) {
      <div class="gmn-table-toolbar">
        <gmn-input
          [placeholder]="resolvedPlaceholder()"
          (valueChange)="onSearch($event)"
        >
          <span prefix>🔍</span>
        </gmn-input>
      </div>
    }

    <div class="gmn-table-wrap" [class.gmn-table-wrap--bordered]="bordered()">
      <table class="gmn-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th
                [class.gmn-table__sticky-col]="col.sticky"
                [style.width]="col.width ?? 'auto'"
                [style.text-align]="col.align ?? 'start'"
              >
                {{ col.label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of filteredData(); track trackRow($index, row); let i = $index) {
            <tr
              [class.gmn-table__row--clickable]="rowClickable()"
              [class.gmn-table__row--striped]="striped() && i % 2 === 1"
            >
              @for (col of columns(); track col.key) {
                <td
                  [class.gmn-table__sticky-col]="col.sticky"
                  [style.text-align]="col.align ?? 'start'"
                >
                  @if (cellTemplate) {
                    <ng-container
                      *ngTemplateOutlet="cellTemplate; context: { $implicit: row, column: col, index: i }"
                    />
                  } @else {
                    {{ row[col.key] }}
                  }
                </td>
              }
            </tr>
          }

          @if (filteredData().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="gmn-table__empty">
                <ng-content select="[empty]" />
                {{ searchQuery().trim() ? ar.common.noSearchResults : ar.common.noData }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './gmn-table.component.scss',
})
export class GmnTableComponent {
  readonly ar = AR;

  readonly columns = input<GmnTableColumn[]>([]);
  readonly data = input<Record<string, unknown>[]>([]);
  readonly striped = input(false);
  readonly bordered = input(true);
  readonly rowClickable = input(false);
  readonly searchable = input(true);
  readonly searchKeys = input<string[]>([]);
  readonly searchPlaceholder = input('');
  readonly trackByFn = input<(index: number, item: Record<string, unknown>) => unknown>();

  @ContentChild('cell', { static: false }) cellTemplate?: TemplateRef<unknown>;

  readonly searchQuery = signal('');

  readonly filteredData = computed(() => {
    const rows = this.data() ?? [];
    const q = this.searchQuery().trim().toLowerCase();
    if (!this.searchable() || !q) return rows;

    const keys = this.resolveSearchKeys();
    return rows.filter((row) => {
      if (keys.some((key) => this.matchesQuery(row[key], q))) return true;
      // Also match extra display fields mapped onto the row (e.g. labels)
      return Object.entries(row).some(([key, value]) => {
        if (key === 'actions' || keys.includes(key)) return false;
        if (key.startsWith('_')) return false;
        return this.matchesQuery(value, q);
      });
    });
  });

  resolvedPlaceholder(): string {
    return this.searchPlaceholder().trim() || AR.common.search;
  }

  onSearch(value: string): void {
    this.searchQuery.set(value ?? '');
  }

  trackRow(index: number, row: Record<string, unknown>): unknown {
    const fn = this.trackByFn();
    return fn ? fn(index, row) : (row['_id'] ?? row['id'] ?? index);
  }

  private matchesQuery(value: unknown, q: string): boolean {
    if (value == null) return false;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.some((item) => this.matchesQuery(item, q));
      }
      return false;
    }
    return String(value).toLowerCase().includes(q);
  }

  private resolveSearchKeys(): string[] {
    const explicit = this.searchKeys();
    if (explicit.length > 0) return explicit;

    return this.columns()
      .filter((col) => col.searchable !== false && col.key !== 'actions')
      .map((col) => col.key);
  }
}
