import { Injectable, signal, computed, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, fromEvent, merge, timer, Subscription, of } from 'rxjs';
import { filter, switchMap, retry, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SalePayload } from '../models/types';

@Injectable({ providedIn: 'root' })
export class OfflineStoreService implements OnDestroy {
  private readonly QUEUE_KEY = 'bakery_offline_sales';
  private readonly flush$ = new Subject<void>();
  private sub: Subscription;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isOnline = signal(this.isBrowser ? navigator.onLine : true);
  readonly queueCount = computed(() => this.loadQueue().length);

  constructor(private http: HttpClient) {
    if (!this.isBrowser) {
      this.sub = new Subscription();
      return;
    }

    merge(
      fromEvent(window, 'online').pipe(tap(() => this.isOnline.set(true))),
      fromEvent(window, 'offline').pipe(tap(() => this.isOnline.set(false))),
    ).subscribe();

    this.sub = merge(
      fromEvent(window, 'online'),
      this.flush$,
      timer(0, 30_000),
    )
      .pipe(
        filter(() => this.isOnline() && this.loadQueue().length > 0),
        switchMap(() => this.flushQueue()),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  enqueue(sale: SalePayload): void {
    if (!this.isBrowser) return;
    const queue = this.loadQueue();
    queue.push(sale);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    this.flush$.next();
  }

  private loadQueue(): SalePayload[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(this.QUEUE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private flushQueue() {
    const queue = this.loadQueue();
    if (queue.length === 0) return of(null);

    return this.http.post(`${environment.apiBaseUrl}/sales`, queue[0]).pipe(
      retry(2),
      tap({
        next: () => {
          const remaining = this.loadQueue().slice(1);
          localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remaining));
        },
      }),
    );
  }
}
