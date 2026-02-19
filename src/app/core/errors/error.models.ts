export type AppAlertLevel = 'error' | 'warning' | 'info' | 'success';

export interface AppAlert {
  id: string;
  level: AppAlertLevel;
  title: string;
  message: string;
  details?: string;
}
