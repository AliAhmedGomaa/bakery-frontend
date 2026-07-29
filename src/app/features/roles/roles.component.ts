import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GmnBadgeComponent,
  GmnButtonComponent,
  GmnCardComponent,
  GmnInputComponent,
  GmnModalComponent,
  GmnTableComponent,
  GmnTableColumn,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { ALL_PERMISSIONS, AppRole, Permission } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    FormsModule,
    GmnCardComponent,
    GmnBadgeComponent,
    GmnTableComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnModalComponent,
  ],
  template: `
    <div class="roles">
      <div class="roles__header">
        <div>
          <h1>{{ ar.rolesPage.title }}</h1>
          <p>{{ ar.rolesPage.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.rolesPage.add }}</gmn-button>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'nameAr') {
              <strong>{{ row['nameAr'] }}</strong>
            } @else if (col.key === 'type') {
              @if (row['isSystem']) {
                <gmn-badge variant="info">{{ ar.rolesPage.system }}</gmn-badge>
              } @else {
                <gmn-badge variant="neutral">{{ ar.rolesPage.custom }}</gmn-badge>
              }
            } @else if (col.key === 'permissions') {
              <span class="perm-count">{{ row['permCount'] }}</span>
            } @else if (col.key === 'isActive') {
              @if (row['isActive']) {
                <gmn-badge variant="success" [dot]="true">{{ ar.rolesPage.active }}</gmn-badge>
              } @else {
                <gmn-badge variant="neutral" [dot]="true">{{ ar.rolesPage.inactive }}</gmn-badge>
              }
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(row['_id'])">{{ ar.rolesPage.edit }}</gmn-button>
                @if (!row['isSystem']) {
                  <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(row['_id'])">{{ ar.rolesPage.delete }}</gmn-button>
                }
              </div>
            } @else {
              {{ row[col.key] }}
            }
          </ng-template>
        </gmn-table>
      </gmn-card>
    </div>

    <gmn-modal
      [open]="showModal()"
      [title]="editingId() ? ar.rolesPage.edit : ar.rolesPage.add"
      size="lg"
      (closed)="showModal.set(false)"
    >
      <div class="role-form">
        @if (!editingId()) {
          <gmn-input [label]="ar.rolesPage.code" [(ngModel)]="form.code" />
          <small>{{ ar.rolesPage.codeHint }}</small>
        } @else {
          <div class="role-form__field">
            <label>{{ ar.rolesPage.code }}</label>
            <strong>{{ form.code }}</strong>
          </div>
        }
        <gmn-input [label]="ar.rolesPage.nameAr" [(ngModel)]="form.nameAr" />
        <div class="role-form__field">
          <label>{{ ar.rolesPage.permissions }}</label>
          <div class="role-form__perms">
            @for (perm of allPermissions; track perm) {
              <label class="role-form__check">
                <input
                  type="checkbox"
                  [checked]="form.permissions.includes(perm)"
                  (change)="togglePermission(perm, $event)"
                  [disabled]="form.code === 'ADMIN'"
                />
                <span>{{ permissionLabel(perm) }}</span>
              </label>
            }
          </div>
        </div>
        @if (editingId()) {
          <label class="role-form__check">
            <input type="checkbox" [(ngModel)]="form.isActive" [disabled]="form.code === 'ADMIN'" />
            <span>{{ ar.rolesPage.active }}</span>
          </label>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.rolesPage.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .roles__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .roles__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .roles__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .perm-count {
      font-variant-numeric: tabular-nums;
      color: var(--text-muted);
    }
    .role-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      direction: rtl;
    }
    .role-form small {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: -0.35rem;
    }
    .role-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .role-form__perms {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: 0.5rem;
    }
    .role-form__check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-container);
    }
  `],
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  readonly ar = AR;
  readonly allPermissions = ALL_PERMISSIONS;

  roles = signal<AppRole[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    code: '',
    nameAr: '',
    permissions: [] as Permission[],
    isActive: true,
  };

  columns: GmnTableColumn[] = [
    { key: 'nameAr', label: AR.rolesPage.nameAr },
    { key: 'code', label: AR.rolesPage.code },
    { key: 'type', label: AR.rolesPage.system },
    { key: 'permissions', label: AR.rolesPage.permissions },
    { key: 'isActive', label: AR.rolesPage.status },
    { key: 'actions', label: AR.rolesPage.actions },
  ];

  tableData = computed(() =>
    this.roles().map((r) => ({
      _id: r._id,
      nameAr: r.nameAr,
      code: r.code,
      isSystem: r.isSystem,
      permCount: r.permissions?.length ?? 0,
      isActive: r.isActive,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<AppRole[]>('/roles').subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.roles.set([]),
    });
  }

  permissionLabel(perm: Permission): string {
    return AR.permissions[perm] ?? perm;
  }

  togglePermission(perm: Permission, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.form.permissions = [...this.form.permissions, perm];
    } else {
      this.form.permissions = this.form.permissions.filter((p) => p !== perm);
    }
  }

  openNew(): void {
    this.editingId.set(null);
    this.form = { code: '', nameAr: '', permissions: [], isActive: true };
    this.showModal.set(true);
  }

  openEdit(id: unknown): void {
    const role = this.roles().find((r) => r._id === String(id));
    if (!role) return;
    this.editingId.set(role._id);
    this.form = {
      code: role.code,
      nameAr: role.nameAr,
      permissions: [...(role.permissions ?? [])],
      isActive: role.isActive,
    };
    this.showModal.set(true);
  }

  confirmDelete(id: unknown): void {
    if (!confirm(AR.rolesPage.confirmDelete)) return;
    this.api.delete(`/roles/${String(id)}`).subscribe({ next: () => this.load() });
  }

  save(): void {
    if (!this.form.nameAr.trim()) return;
    const editId = this.editingId();
    this.saving.set(true);

    if (editId) {
      this.api
        .patch(`/roles/${editId}`, {
          nameAr: this.form.nameAr.trim(),
          permissions: this.form.permissions,
          isActive: this.form.isActive,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.showModal.set(false);
            this.load();
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    if (!this.form.code.trim()) {
      this.saving.set(false);
      return;
    }

    this.api
      .post('/roles', {
        code: this.form.code.trim().toUpperCase(),
        nameAr: this.form.nameAr.trim(),
        permissions: this.form.permissions,
        isActive: true,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showModal.set(false);
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }
}
