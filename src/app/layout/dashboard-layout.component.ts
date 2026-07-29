import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="layout__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }
    .layout__main {
      flex: 1;
      margin-inline-start: 16rem;
      padding: 2rem;
      min-height: 100vh;
      overflow-y: auto;
    }
  `],
})
export class DashboardLayoutComponent {}
