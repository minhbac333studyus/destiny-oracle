export type GoalStatus       = 'active' | 'completed' | 'paused';
export type MilestoneStatus  = 'pending' | 'achieved';

export interface Milestone {
  id:         string;
  text:       string;
  status:     MilestoneStatus;
  achievedAt: Date | null;
}

export interface Goal {
  id:          string;
  aspectKey:   string;
  aspectLabel: string;
  title:       string;
  status:      GoalStatus;
  milestones:  Milestone[];
  createdAt:   Date;
}
