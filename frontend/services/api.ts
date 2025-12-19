

import { User, Teacher, ClassGroup, Student, Session, Score, BehaviorRating, StudentInsightRecord, AttendanceRecord, Location } from '../types';

// Simulate a database delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AppSettings {
  dashboardInsight: string;
  lastAnalyzed: string;
}

// Initial Data Structure (Empty)
let store = {
  settings: {
    dashboardInsight: "",
    lastAnalyzed: ""
  },
  users: [] as any[],
  teachers: [] as Teacher[],
  classes: [] as ClassGroup[],
  students: [] as Student[],
  sessions: [] as Session[],
  attendance: [] as AttendanceRecord[],
  scores: [] as Score[],
  behaviors: [] as BehaviorRating[],
  studentInsights: [] as StudentInsightRecord[],
  locations: [] as Location[]
};

let isInitialized = false;

export const api = {
  // Initialize by fetching JSON
  init: async () => {
    if (isInitialized) return;
    try {
        const response = await fetch('./db.json');
        if (response.ok) {
            const data = await response.json();
            // Merge loaded data with store structure
            store = { ...store, ...data };
            console.log("Database initialized from db.json");
        } else {
            console.warn("Failed to load db.json, starting with empty database.");
        }
    } catch (error) {
        console.warn("Error loading db.json, starting with empty database:", error);
    }
    isInitialized = true;
  },

  // Settings (AI Insights Persistence)
  fetchSettings: async (): Promise<AppSettings> => {
    await delay(200);
    return { ...store.settings };
  },
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    await delay(300);
    store.settings = { ...store.settings, ...settings };
    return { ...store.settings };
  },

  // Student Insights
  fetchStudentInsight: async (studentId: string): Promise<StudentInsightRecord | undefined> => {
    await delay(200);
    return store.studentInsights.find((si: StudentInsightRecord) => si.studentId === studentId);
  },
  saveStudentInsight: async (record: StudentInsightRecord): Promise<void> => {
    await delay(300);
    const index = store.studentInsights.findIndex((si: StudentInsightRecord) => si.studentId === record.studentId);
    if (index >= 0) {
      store.studentInsights[index] = record;
    } else {
      store.studentInsights.push(record);
    }
  },

  // Users
  fetchUsers: async (): Promise<User[]> => {
    await delay(300);
    return [...store.users] as any as User[];
  },

  // Locations
  fetchLocations: async (): Promise<Location[]> => {
    await delay(300);
    return [...(store.locations || [])] as Location[];
  },
  createLocation: async (location: Location): Promise<Location> => {
    await delay(300);
    store.locations = store.locations || [];
    store.locations.push(location);
    return location;
  },
  deleteLocation: async (id: string): Promise<void> => {
    await delay(300);
    store.locations = store.locations.filter((l: Location) => l.id !== id);
  },

  // Teachers
  fetchTeachers: async (): Promise<Teacher[]> => {
    await delay(300);
    return [...store.teachers] as Teacher[];
  },
  createTeacher: async (teacher: Teacher): Promise<Teacher> => {
    await delay(300);
    store.teachers.push(teacher as any);
    
    // Auto-create User Account
    if (teacher.email) {
        const existingUser = store.users.find((u: any) => u.email === teacher.email);
        if (!existingUser) {
            store.users.push({
                id: `u_${teacher.id}`,
                name: teacher.name,
                email: teacher.email,
                password: '123',
                role: 'TEACHER'
            });
        }
    }
    
    return teacher;
  },
  deleteTeacher: async (id: string): Promise<void> => {
    await delay(300);
    store.teachers = store.teachers.filter((t: Teacher) => t.id !== id);
  },

  // Classes
  fetchClasses: async (): Promise<ClassGroup[]> => {
    await delay(300);
    return [...store.classes] as ClassGroup[];
  },
  createClass: async (cls: ClassGroup): Promise<ClassGroup> => {
    await delay(300);
    store.classes.push(cls);
    return cls;
  },
  deleteClass: async (id: string): Promise<void> => {
    await delay(300);
    store.classes = store.classes.filter((c: ClassGroup) => c.id !== id);
  },

  // Students
  fetchStudents: async (): Promise<Student[]> => {
    await delay(300);
    return [...store.students] as Student[];
  },
  updateStudent: async (student: Student): Promise<Student> => {
     await delay(300);
     const idx = store.students.findIndex((s: Student) => s.id === student.id);
     if (idx !== -1) {
         store.students[idx] = student;
     }
     return student;
  },
  createStudent: async (student: Student): Promise<Student> => {
    await delay(300);
    store.students.push(student as any);

    // Auto-create Parent User Account
    if (student.parentEmail) {
        const existingUser = store.users.find((u: any) => u.email === student.parentEmail);
        if (!existingUser) {
            store.users.push({
                id: `u_p_${student.id}`,
                name: student.parentName || 'Parent',
                email: student.parentEmail,
                password: '123',
                role: 'PARENT'
            });
        }
    }

    return student;
  },
  deleteStudent: async (id: string): Promise<void> => {
    await delay(300);
    store.students = store.students.filter((s: Student) => s.id !== id);
  },

  // Sessions
  fetchSessions: async (): Promise<Session[]> => {
    await delay(300);
    return [...store.sessions] as Session[];
  },
  createSession: async (session: Session): Promise<Session> => {
    await delay(300);
    store.sessions.push(session as any);
    return session;
  },
  updateSessionStatus: async (sessionId: string, status: 'COMPLETED' | 'CANCELLED' | 'SCHEDULED'): Promise<void> => {
    await delay(300);
    const idx = store.sessions.findIndex((s: Session) => s.id === sessionId);
    if (idx !== -1) {
        store.sessions[idx] = { ...store.sessions[idx], status };
    }
  },
  
  // Attendance
  fetchAttendance: async (): Promise<AttendanceRecord[]> => {
    await delay(300);
    return [...(store.attendance || [])] as AttendanceRecord[];
  },
  recordAttendance: async (record: AttendanceRecord): Promise<AttendanceRecord> => {
      await delay(200);
      const existingIdx = store.attendance.findIndex((a: AttendanceRecord) => a.sessionId === record.sessionId && a.studentId === record.studentId);
      if (existingIdx !== -1) {
          store.attendance[existingIdx] = record;
      } else {
          store.attendance.push(record);
      }
      return record;
  },

  // Scores
  fetchScores: async (): Promise<Score[]> => {
     await delay(300);
     return [...store.scores] as Score[];
  },

  // Behavior
  fetchBehaviors: async (): Promise<BehaviorRating[]> => {
      await delay(300);
      return [...store.behaviors] as BehaviorRating[];
  },
  recordBehavior: async (behavior: BehaviorRating): Promise<BehaviorRating> => {
      await delay(200);
      // Remove existing behavior for this session/student/category if exists (update logic)
      if (behavior.sessionId) {
          const idx = store.behaviors.findIndex((b: BehaviorRating) => 
            b.studentId === behavior.studentId && 
            b.sessionId === behavior.sessionId && 
            b.category === behavior.category
          );
          if (idx !== -1) {
              store.behaviors[idx] = behavior;
              return behavior;
          }
      }
      store.behaviors.push(behavior);
      return behavior;
  }
};