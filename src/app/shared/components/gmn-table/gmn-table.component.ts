import { Component, Input, ContentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { NgIf, NgTemplateOutlet } from '@angular/common';

export interface GmnTableColumn {
  key: string;
  label: string;
  sticky?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

@Component({
  selector: 'gmn-table',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gmn-table-wrap" [class.gmn-table-wrap--bordered]="bordered">
      <table class="gmn-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
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
          @for (row of data; track trackByFn ? trackByFn($index, row) : $index; let i = $index) {
            <tr
              [class.gmn-table__row--clickable]="rowClickable"
              [class.gmn-table__row--striped]="striped && i % 2 === 1"
            >
              @for (col of columns; track col.key) {
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

          @if (!data || data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length" class="gmn-table__empty">
                <ng-content select="[empty]" />
                <ng-container *ngIf="!hasEmptyContent">No data available</ng-container>
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
  @Input() columns: GmnTableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() striped = false;
  @Input() bordered = true;
  @Input() rowClickable = false;
  @Input() trackByFn?: (index: number, item: Record<string, unknown>) => unknown;

  @ContentChild('cell', { static: false }) cellTemplate?: TemplateRef<unknown>;

  hasEmptyContent = false;
}
