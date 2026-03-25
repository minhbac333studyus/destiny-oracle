export interface UserProfile {
  displayName:           string;
  email:                 string;
  avatarUrl:             string | null;
  timezone:              string;
  notificationsEnabled:  boolean;
  dailyReminderTime:     string;
}
