import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card-tile',
  standalone: true,
  templateUrl: './skeleton-card-tile.component.html',
  styleUrl: './skeleton-card-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCardTileComponent {}
