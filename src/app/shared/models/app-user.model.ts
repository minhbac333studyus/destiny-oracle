export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  chibiUrl: string | null;
  onboardingComplete: boolean;
  joinedAt: Date | string;
  timezone?: string;
  notificationsEnabled?: boolean;
}
