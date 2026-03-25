import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { onboardingCompleteGuard } from './shared/guards/onboarding-complete.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/login/login.routes').then(m => m.LOGIN_ROUTES),
  },
  {
    path: '',
    redirectTo: 'spread',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard, onboardingCompleteGuard],
    children: [
      {
        path: 'spread',
        loadChildren: () =>
          import('./features/spread/spread.routes').then(m => m.SPREAD_ROUTES),
      },
      {
        path: 'card/:cardId',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./features/card-detail/card-detail.routes').then(m => m.CARD_DETAIL_ROUTES),
          },
          {
            path: 'evolved',
            loadChildren: () =>
              import('./features/card-evolved/card-evolved.routes').then(m => m.CARD_EVOLVED_ROUTES),
          },
          {
            path: 'edit-dream',
            loadChildren: () =>
              import('./features/edit-dream/edit-dream.routes').then(m => m.EDIT_DREAM_ROUTES),
          },
        ],
      },
      {
        path: 'checkin',
        loadChildren: () =>
          import('./features/daily-checkin/daily-checkin.routes').then(m => m.DAILY_CHECKIN_ROUTES),
      },
      {
        path: 'add-aspect',
        loadChildren: () =>
          import('./features/add-aspect/add-aspect.routes').then(m => m.ADD_ASPECT_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
      {
        path: 'goals',
        loadChildren: () =>
          import('./features/goals/goals.routes').then(m => m.GOALS_ROUTES),
      },
      {
        path: 'reflection',
        loadChildren: () =>
          import('./features/reflection-chamber/reflection-chamber.routes').then(m => m.REFLECTION_ROUTES),
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./features/ai-chat/ai-chat.routes').then(m => m.AI_CHAT_ROUTES),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/ai-tasks/ai-tasks.routes').then(m => m.AI_TASKS_ROUTES),
      },
      {
        path: 'plans',
        loadChildren: () =>
          import('./features/ai-plans/ai-plans.routes').then(m => m.AI_PLANS_ROUTES),
      },
      {
        path: 'reminders',
        loadChildren: () =>
          import('./features/ai-reminders/ai-reminders.routes').then(m => m.AI_REMINDERS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'spread' },
];
