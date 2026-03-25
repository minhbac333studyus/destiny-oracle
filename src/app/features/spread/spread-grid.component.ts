import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { SpreadCardTileComponent } from './spread-card-tile.component';
import { SkeletonCardTileComponent } from '../../shared/components/skeleton-card-tile/skeleton-card-tile.component';
import { SpreadCardSummary } from '../../shared/services/mock-card.service';

@Component({
  selector: 'app-spread-grid',
  standalone: true,
  imports: [SpreadCardTileComponent, SkeletonCardTileComponent],
  templateUrl: './spread-grid.component.html',
  styleUrl: './spread-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadGridComponent {
  @Input({ required: true }) cards!: SpreadCardSummary[];
  @Input() loading = false;
  @Output() cardSelected  = new EventEmitter<string>();
  @Output() addCardClicked = new EventEmitter<void>();

  /** Skeleton placeholder count while loading */
  readonly skeletonCount = Array(6).fill(0);
}
