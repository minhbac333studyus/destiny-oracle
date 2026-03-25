import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { Subject, interval } from 'rxjs';
import { catchError, of, switchMap, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

export interface JobStep {
  id: string;
  stepOrder: number;
  stepName: string;
  phase: 'PROMPT' | 'IMAGE';
  stage: string;
  status: 'WAITING' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';
  message: string | null;
  resultUrl: string | null;
}

export interface GenerationJob {
  id: string;
  cardId: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  errorMessage: string | null;
  steps: JobStep[];
}

@Component({
  selector: 'app-generation-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generation-progress.component.html',
  styleUrl: './generation-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationProgressComponent implements OnInit, OnDestroy {
  @Input({ required: true }) cardId!: string;
  @Input() cardLabel = 'Card';

  @Output() completed  = new EventEmitter<void>();
  @Output() failed     = new EventEmitter<string>();
  @Output() dismissed  = new EventEmitter<void>();

  readonly #api      = inject(ApiService);
  readonly #destroy$ = new Subject<void>();

  readonly job       = signal<GenerationJob | null>(null);
  readonly noJobYet  = signal(true);

  ngOnInit(): void {
    // Poll immediately, then every 2s
    interval(2000).pipe(
      switchMap(() =>
        this.#api.getLatestJob(this.cardId).pipe(
          catchError(() => of(null)),
        ),
      ),
      takeUntil(this.#destroy$),
    ).subscribe(job => {
      if (job) {
        this.noJobYet.set(false);
        this.job.set(job);

        if (job.status === 'COMPLETED') {
          this.#destroy$.next();
          setTimeout(() => this.completed.emit(), 800); // brief pause to show 100%
        } else if (job.status === 'FAILED') {
          this.#destroy$.next();
          this.failed.emit(job.errorMessage ?? 'Generation failed');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }

  promptSteps(): JobStep[] {
    return (this.job()?.steps ?? []).filter(s => s.phase === 'PROMPT');
  }

  imageSteps(): JobStep[] {
    return (this.job()?.steps ?? []).filter(s => s.phase === 'IMAGE');
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'DONE':    return '✓';
      case 'RUNNING': return '⚡';
      case 'FAILED':  return '✗';
      case 'SKIPPED': return '—';
      default:        return '○';
    }
  }

  phaseLabel(): string {
    const job = this.job();
    if (!job) return 'Starting…';
    const running = job.steps.find(s => s.status === 'RUNNING');
    if (!running) return job.status === 'COMPLETED' ? 'Complete!' : 'Queued…';
    return running.phase === 'PROMPT' ? 'Writing image prompts…' : 'Generating card images…';
  }

  stageLabel(stage: string): string {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}
