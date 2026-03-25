import { Injectable, signal, computed } from '@angular/core';
import { Goal, Milestone } from './goals.model';

const MOCK_GOALS: Goal[] = [
  {
    id: 'g1', aspectKey: 'health', aspectLabel: 'Health & Body',
    title: 'Run a 5K', status: 'active', createdAt: new Date('2026-01-15'),
    milestones: [
      { id: 'm1', text: 'Run 1km without stopping',    status: 'achieved', achievedAt: new Date('2026-02-01') },
      { id: 'm2', text: 'Run 3km without stopping',    status: 'achieved', achievedAt: new Date('2026-02-20') },
      { id: 'm3', text: 'Complete first 5K race',      status: 'pending',  achievedAt: null },
    ],
  },
  {
    id: 'g2', aspectKey: 'career', aspectLabel: 'Career & Purpose',
    title: 'Launch a side project', status: 'active', createdAt: new Date('2026-02-01'),
    milestones: [
      { id: 'm4', text: 'Define the idea and validate', status: 'achieved', achievedAt: new Date('2026-02-10') },
      { id: 'm5', text: 'Build MVP',                   status: 'pending',  achievedAt: null },
      { id: 'm6', text: 'Get first 10 users',          status: 'pending',  achievedAt: null },
    ],
  },
  {
    id: 'g3', aspectKey: 'finances', aspectLabel: 'Finances',
    title: 'Build a 3-month emergency fund', status: 'active', createdAt: new Date('2026-03-01'),
    milestones: [
      { id: 'm7', text: 'Save first $500',   status: 'achieved', achievedAt: new Date('2026-03-15') },
      { id: 'm8', text: 'Save first $2,000', status: 'pending',  achievedAt: null },
      { id: 'm9', text: 'Reach full 3-month fund', status: 'pending', achievedAt: null },
    ],
  },
];

@Injectable()
export class GoalsStore {
  readonly goals = signal<Goal[]>(MOCK_GOALS);

  readonly activeCount    = computed(() => this.goals().filter(g => g.status === 'active').length);
  readonly completedCount = computed(() => this.goals().filter(g => g.status === 'completed').length);

  toggleMilestone(goalId: string, milestoneId: string): void {
    this.goals.update(goals => goals.map(g => g.id !== goalId ? g : ({
      ...g,
      milestones: g.milestones.map(m => m.id !== milestoneId ? m : ({
        ...m,
        status:     m.status === 'achieved' ? 'pending' : 'achieved',
        achievedAt: m.status === 'achieved' ? null : new Date(),
      })),
    })));
  }

  milestoneProgress(goal: Goal): number {
    if (!goal.milestones.length) return 0;
    return Math.round(goal.milestones.filter(m => m.status === 'achieved').length / goal.milestones.length * 100);
  }
}
