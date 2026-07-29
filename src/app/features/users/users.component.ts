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
  ConfirmDialogService,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { AppRole, User } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

interface ManagedUser extends User {
  _id: string;
  isActive: boolean;
}

@Component({
  selector: 'app-users',
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
    <div class="users">
      <div class="users__header">
        <div>
          <h1>{{ ar.users.title }}</h1>
          <p>{{ ar.users.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.users.add }}</gmn-button>
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
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(row['_id'])">{{ ar.users.editUser }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(row['_id'])">{{ ar.users.delete }}</gmn-button>
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
      [title]="editingId() ? ar.users.editUser : ar.users.add"
      size="md"
      (closed)="showModal.set(false)"
    >
      <div class="user-form">
        <gmn-input [label]="ar.users.name" [(ngModel)]="form.name" />
        <gmn-input [label]="ar.users.mobile" type="tel" [(ngModel)]="form.mobile" [disabled]="!!editingId()" />
        <div class="user-form__field">
          <label>{{ ar.users.role }}</label>
          <select [(ngModel)]="form.role" class="user-form__select">
            @for (role of activeRoles(); track role.code) {
              <option [value]="role.code">{{ role.nameAr }}</option>
            }
          </select>
        </div>
        <gmn-input
          [label]="editingId() ? ar.users.passwordOptional : ar.users.password"
          type="password"
          [(ngModel)]="form.password"
        />
        @if (editingId()) {
          <label class="user-form__check">
            <input type="checkbox" [(ngModel)]="form.isActive" />
            <span>{{ ar.users.active }}</span>
          </label>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.users.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .users__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
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
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      direction: rtl;
    }
    .user-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .user-form__select {
      width: 100%;
      height: 2.75rem;
      padding: 0 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      direction: rtl;
    }
    .user-form__check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
  `],
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private confirmDialog = inject(ConfirmDialogService);
  readonly ar = AR;

  users = signal<ManagedUser[]>([]);
  roles = signal<AppRole[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    name: '',
    mobile: '',
    role: 'CASHIER',
    password: '',
    isActive: true,
  };

  columns: GmnTableColumn[] = [
    { key: 'name', label: AR.users.name },
    { key: 'mobile', label: AR.users.mobile },
    { key: 'role', label: AR.users.role },
    { key: 'isActive', label: AR.users.status },
    { key: 'actions', label: AR.users.actions },
  ];

  activeRoles = computed(() => this.roles().filter((r) => r.isActive));

  tableData = computed(() =>
    this.users().map((u) => ({
      _id: u._id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      isActive: u.isActive ?? true,
    })),
  );

  ngOnInit(): void {
    this.load();
    this.api.get<AppRole[]>('/roles').subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.roles.set([]),
    });
  }

  load(): void {
    this.api.get<ManagedUser[]>('/users').subscribe({
      next: (data) =>
        this.users.set(
          data.map((u) => ({
            ...u,
            _id: u._id || u.id,
            isActive: u.isActive ?? true,
          })),
        ),
      error: () => this.users.set([]),
    });
  }

  roleLabel(code: unknown): string {
    const value = String(code);
    return this.roles().find((r) => r.code === value)?.nameAr ?? value;
  }

  openNew(): void {
    this.editingId.set(null);
    const defaultRole = this.activeRoles().find((r) => r.code === 'CASHIER')?.code
      ?? this.activeRoles()[0]?.code
      ?? 'CASHIER';
    this.form = {
      name: '',
      mobile: '',
      role: defaultRole,
      password: '',
      isActive: true,
    };
    this.showModal.set(true);
  }

  openEdit(id: unknown): void {
    const user = this.users().find((u) => u._id === String(id));
    if (!user) return;
    this.editingId.set(user._id);
    this.form = {
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      password: '',
      isActive: user.isActive ?? true,
    };
    this.showModal.set(true);
  }

  async confirmDelete(id: unknown): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      message: AR.users.confirmDelete,
      confirmLabel: AR.users.delete,
    });
    if (!ok) return;
    this.api.delete(`/users/${String(id)}`).subscribe({
      next: () => this.load(),
    });
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.mobile.trim()) return;
    const editId = this.editingId();
    this.saving.set(true);

    if (editId) {
      const body: Record<string, unknown> = {
        name: this.form.name.trim(),
        role: this.form.role,
        isActive: this.form.isActive,
      };
      if (this.form.password.trim()) body['password'] = this.form.password;
      this.api.patch(`/users/${editId}`, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.showModal.set(false);
          this.load();
        },
        error: () => this.saving.set(false),
      });
      return;
    }

    if (!this.form.password.trim()) {
      this.saving.set(false);
      return;
    }

    this.api
      .post('/users', {
        name: this.form.name.trim(),
        mobile: this.form.mobile.trim(),
        role: this.form.role,
        password: this.form.password,
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
