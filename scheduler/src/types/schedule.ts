export type ScheduleCategory = 'Work' | 'Personal' | 'Important' | 'Meeting' | 'Etc';

export interface Schedule {
  id: string;
  userId?: string; // 다중 사용자 격리를 위한 외래 키
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  category: ScheduleCategory;
  isCompleted: boolean;
  createdAt?: string; // ISO 8601 string
}

export interface CreateScheduleInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category: ScheduleCategory;
  userId?: string;
}

export interface UpdateScheduleInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  category?: ScheduleCategory;
  isCompleted?: boolean;
  userId?: string;
}
