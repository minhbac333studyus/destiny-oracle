export type OnboardingStep =
  | 'welcome'
  | 'questions'
  | 'card-reveal';

export interface OnboardingData {
  aspectLabel: string;
  fear1: string;   // What is most uncertain about your feeling
  fear2: string;   // What is the worst case in the future in that direction
  fear3: string;   // What you can do or try to do now
  dream: string;   // What is the best case
}
