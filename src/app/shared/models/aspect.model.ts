/** Aspect keys are now user-defined strings — no preset list. */
export type AspectKey = string;

export interface LifeAspect {
  key: AspectKey;
  label: string;
  icon: string;
  isCustom: boolean;
}
