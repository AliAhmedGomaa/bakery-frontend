import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly stateSignal = signal<ConfirmDialogState>({
    open: false,
    message: '',
    resolve: null,
  });

  readonly state = this.stateSignal.asReadonly();

  confirm(options: ConfirmDialogOptions | string): Promise<boolean> {
    const opts: ConfirmDialogOptions =
      typeof options === 'string' ? { message: options } : options;

    return new Promise<boolean>((resolve) => {
      this.stateSignal.set({
        open: true,
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        danger: opts.danger ?? true,
        resolve,
      });
    });
  }

  accept(): void {
    this.close(true);
  }

  dismiss(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    const current = this.stateSignal();
    current.resolve?.(result);
    this.stateSignal.set({
      open: false,
      message: '',
      resolve: null,
    });
  }
}
