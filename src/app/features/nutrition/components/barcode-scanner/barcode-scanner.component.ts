import {
  ChangeDetectionStrategy, Component, Output, EventEmitter,
  ElementRef, ViewChild, AfterViewInit, OnDestroy, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OracleButtonComponent } from '../../../../shared/components/oracle-button/oracle-button.component';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [FormsModule, OracleButtonComponent],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('scannerContainer') scannerContainer!: ElementRef<HTMLDivElement>;

  readonly scanning = signal(false);
  readonly error = signal('');
  manualBarcode = '';

  private scanner: any = null;

  async ngAfterViewInit(): Promise<void> {
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    this.scanning.set(true);
    this.error.set('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      this.scanner = new Html5Qrcode('barcode-reader');

      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          this.onScan(decodedText);
        },
        () => {} // ignore scan failures
      );
    } catch (err: any) {
      this.scanning.set(false);
      this.error.set(err?.message || 'Camera not available. Use manual entry below.');
    }
  }

  private onScan(barcode: string): void {
    this.stopCamera();
    this.scanned.emit(barcode);
  }

  submitManual(): void {
    const code = this.manualBarcode.trim();
    if (code) {
      this.scanned.emit(code);
      this.manualBarcode = '';
    }
  }

  private stopCamera(): void {
    if (this.scanner) {
      this.scanner.stop().catch(() => {});
      this.scanner.clear().catch(() => {});
      this.scanner = null;
    }
    this.scanning.set(false);
  }
}
