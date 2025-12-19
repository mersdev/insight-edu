import request from 'supertest';
import app, { server } from '../src/server.js';

describe('API Endpoints', () => {
  let authToken;
  let testSessionId;
  let testAttendanceId;

  // Login before running tests to get authentication token
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edu.com',
        password: 'Admin123'
      });

    if (res.statusCode !== 200) {
      console.error('Login failed:', res.statusCode, res.body);
      throw new Error('Failed to login for API tests');
    }

    authToken = res.body.token;
    // Generate unique IDs for this test run
    testSessionId = `test_ses_${Date.now()}`;
    testAttendanceId = `test_att_${Date.now()}`;
  });

  afterAll((done) => {
    server.close(done);
  });

  // Health Check
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });

  // Settings
  describe('Settings API', () => {
    it('GET /api/settings should return settings', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('dashboardInsight');
      expect(res.body).toHaveProperty('lastAnalyzed');
    });

    it('PUT /api/settings should update settings', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dashboardInsight: 'Test insight',
          lastAnalyzed: '2025-01-01'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('dashboardInsight');
    });
  });

  // Users
  describe('Users API', () => {
    it('GET /api/users should return all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // Locations
  describe('Locations API', () => {
    it('GET /api/locations should return all locations', async () => {
      const res = await request(app)
        .get('/api/locations')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/locations should create a new location', async () => {
      const newLocation = {
        id: 'test_loc_1',
        name: 'Test Location',
        address: '123 Test St'
      };
      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLocation);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'test_loc_1');
    });

    it('DELETE /api/locations/:id should delete a location', async () => {
      const res = await request(app)
        .delete('/api/locations/test_loc_1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(204);
    });
  });

  // Teachers
  describe('Teachers API', () => {
    it('GET /api/teachers should return all teachers', async () => {
      const res = await request(app)
        .get('/api/teachers')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/teachers should create a new teacher', async () => {
      const newTeacher = {
        id: 'test_t1',
        name: 'Test Teacher',
        englishName: 'Test',
        chineseName: '测试',
        email: 'test@teacher.com',
        subject: 'Testing',
        phone: '123-456-7890',
        description: 'Test teacher'
      };
      const res = await request(app)
        .post('/api/teachers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTeacher);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'test_t1');
    });

    it('DELETE /api/teachers/:id should delete a teacher', async () => {
      const res = await request(app)
        .delete('/api/teachers/test_t1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(204);
    });
  });

  // Classes
  describe('Classes API', () => {
    it('GET /api/classes should return all classes', async () => {
      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/classes should create a new class', async () => {
      const newClass = {
        id: 'test_c1',
        name: 'Test Class',
        teacherId: 't1',
        locationId: 'l1',
        grade: '10',
        defaultSchedule: { dayOfWeek: 'Monday', time: '10:00' }
      };
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newClass);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'test_c1');
    });

    it('DELETE /api/classes/:id should delete a class', async () => {
      const res = await request(app)
        .delete('/api/classes/test_c1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(204);
    });
  });

  // Students
  describe('Students API', () => {
    it('GET /api/students should return all students', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/students should create a new student', async () => {
      const newStudent = {
        id: 'test_s1',
        name: 'Test Student',
        parent_id: 'u_p1',
        class_ids: ['c1'],
        attendance: 100,
        at_risk: false,
        school: 'Test School',
        parent_name: 'Test Parent',
        relationship: 'Father',
        emergency_contact: '123-456-7890',
        parent_email: 'test@parent.com'
      };
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStudent);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'test_s1');
    });

    it('PUT /api/students/:id should update a student', async () => {
      const updatedStudent = {
        name: 'Updated Student',
        parent_id: 'u_p1',
        class_ids: ['c1', 'c2'],
        attendance: 95,
        at_risk: false,
        school: 'Updated School',
        parent_name: 'Test Parent',
        relationship: 'Father',
        emergency_contact: '123-456-7890',
        parent_email: 'test@parent.com'
      };
      const res = await request(app)
        .put('/api/students/test_s1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedStudent);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Student');
    });

    it('DELETE /api/students/:id should delete a student', async () => {
      const res = await request(app)
        .delete('/api/students/test_s1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(204);
    });
  });

  // Sessions
  describe('Sessions API', () => {
    it('GET /api/sessions should return all sessions', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/sessions should create a new session', async () => {
      const newSession = {
        id: testSessionId,
        classId: 'c1',
        date: '2025-01-15',
        startTime: '10:00',
        type: 'REGULAR',
        status: 'SCHEDULED'
      };
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSession);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', testSessionId);
    });

    it('PUT /api/sessions/:id/status should update session status', async () => {
      const res = await request(app)
        .put(`/api/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'COMPLETED');
    });
  });

  // Attendance
  describe('Attendance API', () => {
    it('GET /api/attendance should return all attendance records', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/attendance should record attendance', async () => {
      const newAttendance = {
        id: testAttendanceId,
        studentId: 's1',
        sessionId: testSessionId,
        status: 'PRESENT'
      };
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAttendance);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'PRESENT');
    });
  });

  // Scores
  describe('Scores API', () => {
    it('GET /api/scores should return all scores', async () => {
      const res = await request(app)
        .get('/api/scores')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Behaviors
  describe('Behaviors API', () => {
    it('GET /api/behaviors should return all behaviors', async () => {
      const res = await request(app)
        .get('/api/behaviors')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/behaviors should record behavior', async () => {
      const newBehavior = {
        studentId: 's1',
        sessionId: testSessionId,
        date: '2025-01-15T10:00:00Z',
        category: 'Attention',
        rating: 5
      };
      const res = await request(app)
        .post('/api/behaviors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBehavior);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('rating', 5);
    });
  });

  // Student Insights
  describe('Student Insights API', () => {
    it('POST /api/student-insights should save student insight', async () => {
      const newInsight = {
        studentId: 's1',
        insights: [
          { studentId: 's1', type: 'POSITIVE', message: 'Great progress', date: '2025-01-15' }
        ],
        lastAnalyzed: '2025-01-15'
      };
      const res = await request(app)
        .post('/api/student-insights')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newInsight);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('studentId', 's1');
    });

    it('GET /api/student-insights/:studentId should return student insight', async () => {
      const res = await request(app)
        .get('/api/student-insights/s1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('studentId', 's1');
    });
  });
});
