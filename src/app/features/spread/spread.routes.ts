import { Routes } from '@angular/router';
import { SpreadPageComponent } from './spread-page.component';
import { SpreadStore } from './spread.store';

export const SPREAD_ROUTES: Routes = [
  { path: '', component: SpreadPageComponent, providers: [SpreadStore] },
];
