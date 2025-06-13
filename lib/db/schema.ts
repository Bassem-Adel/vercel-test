export interface Space {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: Date | null;
  }
  
export interface User {
    id: number;
    name: string;
    email: string;
    updatedAt: Date | null;
  }

export interface ProfileSpace {
    profile_id: string;
    space_id: string;
}
  
export interface Student {
  id: string;
  name: string;
  dob: string;
  imagePath: string;
  embedding: string;
  gender: string;
  groupId: string;
  spaceId: string;
}

export interface StudentMissing {
    id: string;
    student_id: string;
    date: string; // ISO string date
    type: string;
    notes?: string;
    persons?: string;
    spaceId: string;
}

export interface Group {
  id: string;
  name: string;
  parentId: string;
  spaceId: string;
}

export interface EventType {
  id: string;
  name: string;
  icon?: string;
  attendancePoints?: number;
  acceptsActivities?: boolean;
  extraPoints?: Array<Record<string, any>>;
  // extraPoints?: Array<{ activity: string; points: number }>;
  spaceId: string;
}

export interface Event {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  eventTypeId: string;
  spaceId: string;
}

export interface EventStudent {
  studentId: string;
  eventId: string;
  isPresent: boolean;
  points: number;
  description?: string;
}

export interface Activity {
  id: string;
  eventId?: string;
  name: string;
  description?: string;
  spaceId: string;
  created_at: string; // ISO string date
}

export interface ActivityGroup {
    activityId: string;
    groupId: string;
    points: number;
}

export interface GroupTransaction {
    id: string;
    group_id: string;
    activity_id: string;
    points: number;
    comment?: string;
    profileId?: string;
    createdAt: string; // ISO string date
}
