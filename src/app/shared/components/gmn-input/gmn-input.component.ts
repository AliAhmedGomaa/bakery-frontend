import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'gmn-input',
  standalone: true,
  imports: [NgClass, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GmnInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="gmn-input-wrap"
      [ngClass]="{
        'gmn-input-wrap--focused': focused(),
        'gmn-input-wrap--filled': !!value,
        'gmn-input-wrap--error': error,
        'gmn-input-wrap--disabled': disabled
      }"
    >
      <div class="gmn-input-wrap__prefix">
        <ng-content select="[prefix]" />
      </div>

      <div class="gmn-input-wrap__field">
        @if (label) {
          <label class="gmn-input-wrap__label" [for]="inputId">{{ label }}</label>
        }
        <input
          class="gmn-input-wrap__input"
          [id]="inputId"
          [type]="type"
          dir="rtl"
          [placeholder]="focused() || !label ? placeholder : ''"
          [disabled]="disabled"
          [value]="value"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
      </div>

      <div class="gmn-input-wrap__suffix">
        <ng-content select="[suffix]" />
      </div>
    </div>

    @if (error) {
      <p class="gmn-input-error">{{ error }}</p>
    }
    @if (hint && !error) {
      <p class="gmn-input-hint">{{ hint }}</p>
    }
  `,
  styleUrl: './gmn-input.component.scss',
})
export class GmnInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() inputId = `gmn-input-${Math.random().toString(36).slice(2, 8)}`;
  @Output() valueChange = new EventEmitter<string>();

  value = '';
  focused = signal(false);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }
}
