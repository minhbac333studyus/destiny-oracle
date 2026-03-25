export interface HabitCheckItem {
  habitId:     string;
  habitText:   string;
  aspectLabel: string;
  aspectKey:   string;
  isChecked:   boolean;
}

export interface CheckinSession {
  date:           string;
  items:          HabitCheckItem[];
  completedAt:    Date | null;
  totalHabits:    number;
  completedCount: number;
}
