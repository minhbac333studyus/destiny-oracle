import { Routes } from '@angular/router';
import { CardDetailPageComponent } from './card-detail-page.component';
import { CardDetailStore } from './card-detail.store';

export const CARD_DETAIL_ROUTES: Routes = [
  { path: '', component: CardDetailPageComponent, providers: [CardDetailStore] },
];
