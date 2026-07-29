import { Component, OnInit, inject, signal } from '@angular/core';
import {
  GmnBadgeComponent,
  GmnCardComponent,
  GmnTableComponent,
  GmnTableColumn,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { Role, User } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [GmnCardComponent, GmnBadgeComponent, GmnTableComponent],
  template: `
    <div class="users">
      <div class="users__header">
        <h1>{{ ar.users.title }}</h1>
        <p>{{ ar.users.subtitle }}</p>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'name') {
              <strong>{{ row['name'] }}</strong>
            } @else if (col.key === 'role') {
              <gmn-badge variant="info">{{ roleLabel(row['role']) }}</gmn-badge>
            } @else if (col.key === 'isActive') {
              @if (row['isActive']) {
                <gmn-badge variant="success" [dot]="true">{{ ar.users.active }}</gmn-badge>
              } @else {
                <gmn-badge variant="neutral" [dot]="true">{{ ar.users.inactive }}</gmn-badge>
              }
            } @else {
              {{ row[col.key] }}
            }
          </ng-template>
        </gmn-table>
      </gmn-card>
    </div>
  `,
  styles: [`
    .users__header {
      margin-bottom: 1.5rem;
    }
    .users__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .users__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `],
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  readonly ar = AR;

  users = signal<User[]>([]);

  columns: GmnTableColumn[] = [
    { key: 'name', label: AR.users.name },
    { key: 'mobile', label: AR.users.mobile },
    { key: 'role', label: AR.users.role },
    { key: 'isActive', label: AR.users.status },
  ];

  tableData = signal<Record<string, unknown>[]>([]);

  ngOnInit(): void {
    this.api.get<Array<User & { isActive?: boolean }>>('/users').subscribe({
      next: (data) => {
        this.users.set(data);
        this.tableData.set(
          data.map((u) => ({
            name: u.name,
            mobile: u.mobile,
            role: u.role,
            isActive: u.isActive ?? true,
          })),
        );
      },
      error: () => {
        // Fallback: endpoint may not exist yet — keep empty table
        this.tableData.set([]);
      },
    });
  }

  roleLabel(role: unknown): string {
    return AR.roles[role as Role] ?? String(role);
  }
}
