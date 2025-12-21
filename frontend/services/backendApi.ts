import { User, Teacher, ClassGroup, Student, Session, Score, BehaviorRating, StudentInsightRecord, AttendanceRecord, Location } from '../types';

// Cloudflare Workers endpoint - update this with your actual deployment URL
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const API_BASE_URL = RAW_API_URL.replace(/\/$/, '').endsWith('/api/v1')
  ? RAW_API_URL.replace(/\/$/, '')
  : RAW_API_URL.replace(/\/$/, '').endsWith('/api')
    ? `${RAW_API_URL.replace(/\/$/, '')}/v1`
    : `${RAW_API_URL.replace(/\/$/, '')}/api/v1`;
const AUTH_BASE = `${API_BASE_URL}/auth`;
const ADMIN_BASE = `${API_BASE_URL}/admin`;
const TEACHER_BASE = `${API_BASE_URL}/teacher`;

interface AppSettings {
  dashboardInsight: string;
  lastAnalyzed: string;
  insightAutoUpdateHours?: number;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
  };
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Token and user session management
let authToken: string | null = localStorage.getItem('authToken');

const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// User session management
const setUserSession = (user: LoginResponse['user']) => {
  localStorage.setItem('userSession', JSON.stringify(user));
};

const getUserSession = (): LoginResponse['user'] | null => {
  const session = localStorage.getItem('userSession');
  if (session) {
    try {
      return JSON.parse(session);
    } catch (e) {
      console.error('Failed to parse user session:', e);
      return null;
    }
  }
  return null;
};

const clearUserSession = () => {
  localStorage.removeItem('userSession');
};

const getAuthHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

export const api = {
  // Initialize (no-op for backend API)
  init: async () => {
    console.log("Using backend API at", API_BASE_URL);
  },

  // Authentication
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setAuthToken(data.token);
    setUserSession(data.user); // Store user session
    return data;
  },

  logout: () => {
    setAuthToken(null);
    clearUserSession(); // Clear user session
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${AUTH_BASE}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  },

  getAuthToken: () => authToken,

  isAuthenticated: () => !!authToken,

  // Get stored user session
  getStoredSession: (): { user: LoginResponse['user'], token: string } | null => {
    const user = getUserSession();
    const token = authToken;
    if (user && token) {
      return { user, token };
    }
    return null;
  },

  // Verify token and get current user
  verifyToken: async (): Promise<LoginResponse['user'] | null> => {
    if (!authToken) return null;

    try {
      const response = await fetch(`${AUTH_BASE}/me`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Token is invalid, clear session
        setAuthToken(null);
        clearUserSession();
        return null;
      }

      const data = await response.json();
      const user = toCamelCase(data);
      setUserSession(user); // Update stored session
      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      setAuthToken(null);
      clearUserSession();
      return null;
    }
  },

  // Settings
  fetchSettings: async (): Promise<AppSettings> => {
    const response = await fetch(`${ADMIN_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    return toCamelCase(data);
  },
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const response = await fetch(`${ADMIN_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(settings))
    });
    const data = await response.json();
    return toCamelCase(data);
  },

  // Student Insights
  fetchStudentInsight: async (studentId: string): Promise<StudentInsightRecord | undefined> => {
    try {
      const response = await fetch(`${TEACHER_BASE}/student-insights/${studentId}`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 404) return undefined;
      const data = await response.json();
      return toCamelCase(data);
    } catch (error) {
      return undefined;
    }
  },
  saveStudentInsight: async (record: StudentInsightRecord): Promise<void> => {
    await fetch(`${TEACHER_BASE}/student-insights`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(record))
    });
  },

  // Users
  fetchUsers: async (): Promise<User[]> => {
    const response = await fetch(`${ADMIN_BASE}/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },

  // Locations
  fetchLocations: async (): Promise<Location[]> => {
    const response = await fetch(`${ADMIN_BASE}/locations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createLocation: async (location: Location): Promise<Location> => {
    const response = await fetch(`${ADMIN_BASE}/locations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(location)
    });
    if (!response.ok) {
      throw new Error(`Failed to create location: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  deleteLocation: async (id: string): Promise<void> => {
    const response = await fetch(`${ADMIN_BASE}/locations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete location: ${response.statusText}`);
    }
  },

  // Teachers
  fetchTeachers: async (): Promise<Teacher[]> => {
    const response = await fetch(`${ADMIN_BASE}/teachers`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch teachers: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createTeacher: async (teacher: Teacher): Promise<Teacher> => {
    const response = await fetch(`${ADMIN_BASE}/teachers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(teacher))
    });
    if (!response.ok) {
      throw new Error(`Failed to create teacher: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  deleteTeacher: async (id: string): Promise<void> => {
    const response = await fetch(`${ADMIN_BASE}/teachers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete teacher: ${response.statusText}`);
    }
  },

  // Classes
  fetchClasses: async (): Promise<ClassGroup[]> => {
    const response = await fetch(`${ADMIN_BASE}/classes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createClass: async (cls: ClassGroup): Promise<ClassGroup> => {
    const response = await fetch(`${ADMIN_BASE}/classes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(cls))
    });
    if (!response.ok) {
      throw new Error(`Failed to create class: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  deleteClass: async (id: string): Promise<void> => {
    const response = await fetch(`${ADMIN_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete class: ${response.statusText}`);
    }
  },

  // Students
  fetchStudents: async (): Promise<Student[]> => {
    const response = await fetch(`${ADMIN_BASE}/students`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  updateStudent: async (student: Student): Promise<Student> => {
    const response = await fetch(`${ADMIN_BASE}/students/${student.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(student))
    });
    if (!response.ok) {
      throw new Error(`Failed to update student: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createStudent: async (student: Student): Promise<Student> => {
    const response = await fetch(`${ADMIN_BASE}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(student))
    });
    if (!response.ok) {
      throw new Error(`Failed to create student: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  deleteStudent: async (id: string): Promise<void> => {
    const response = await fetch(`${ADMIN_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete student: ${response.statusText}`);
    }
  },

  // Sessions
  fetchSessions: async (): Promise<Session[]> => {
    const response = await fetch(`${ADMIN_BASE}/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createSession: async (session: Session): Promise<Session> => {
    const response = await fetch(`${ADMIN_BASE}/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(session))
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  updateSessionStatus: async (sessionId: string, status: 'COMPLETED' | 'CANCELLED' | 'SCHEDULED'): Promise<void> => {
    const response = await fetch(`${ADMIN_BASE}/sessions/${sessionId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      throw new Error(`Failed to update session status: ${response.statusText}`);
    }
  },

  // Attendance
  fetchAttendance: async (): Promise<AttendanceRecord[]> => {
    const response = await fetch(`${TEACHER_BASE}/attendance`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  recordAttendance: async (record: AttendanceRecord): Promise<AttendanceRecord> => {
    const response = await fetch(`${TEACHER_BASE}/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(record))
    });
    if (!response.ok) {
      throw new Error(`Failed to record attendance: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },

  // Scores
  fetchScores: async (): Promise<Score[]> => {
    const response = await fetch(`${TEACHER_BASE}/scores`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch scores: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  createScore: async (score: Score): Promise<Score> => {
    const response = await fetch(`${TEACHER_BASE}/scores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(score))
    });
    if (!response.ok) {
      throw new Error(`Failed to create score: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },

  // Behavior
  fetchBehaviors: async (): Promise<BehaviorRating[]> => {
    const response = await fetch(`${TEACHER_BASE}/behaviors`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch behaviors: ${response.statusText}`);
    }
    const data = await response.json();
    return toCamelCase(data);
  },
  recordBehavior: async (behavior: BehaviorRating): Promise<BehaviorRating> => {
    const response = await fetch(`${TEACHER_BASE}/behaviors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toSnakeCase(behavior))
    });
    const data = await response.json();
    return toCamelCase(data);
  }
};
