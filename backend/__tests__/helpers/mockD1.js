/**
 * Mock D1 Database for Testing
 */

export class MockD1 {
  constructor() {
    this.data = {
      users: [
        {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_hash: null,
          role: 'TEACHER',
          must_change_password: 0,
        },
        // Seed data users - using plain password for testing (password_hash set to null)
        {
          id: 'admin',
          name: 'HQ Admin',
          email: 'admin@edu.com',
          password: 'Admin123',
          password_hash: null, // Set to null to use plain password comparison in tests
          role: 'HQ',
          must_change_password: 1,
        },
        {
          id: 'u_t1',
          name: 'Sarah Jenkins',
          email: 'dehoulworker+sarahjenkins@gmail.com',
          password: '123',
          password_hash: null, // Set to null to use plain password comparison in tests
          role: 'TEACHER',
          must_change_password: 1,
        },
        {
          id: 'u_p1',
          name: 'Mr. Ahmad',
          email: 'dehoulworker+ali@gmail.com',
          password: '123',
          password_hash: null, // Set to null to use plain password comparison in tests
          role: 'PARENT',
          must_change_password: 1,
        },
      ],
      settings: [
        {
          id: 1,
          dashboard_insight: 'Test insight',
          last_analyzed: '2024-01-01',
          insight_auto_update_hours: 12,
        },
      ],
      locations: [
        { id: 'l1', name: 'Cheras', address: 'Jalan Cerdas, Taman Connaught' },
        { id: 'l2', name: 'Petaling Jaya', address: 'Jalan Yong Shook Lin, PJ New Town' },
        { id: 'l3', name: 'Subang Jaya', address: 'Jalan SS 15/8' },
        { id: 'l4', name: 'Kuala Lumpur', address: 'Jalan Ampang' },
      ],
      teachers: [
        {
          id: 't1',
          name: 'Sarah Jenkins',
          english_name: 'Sarah',
          chinese_name: '-',
          email: 'dehoulworker+sarahjenkins@gmail.com',
          subject: 'Mathematics',
          phone: '012-345 6789',
          description: 'Head of Mathematics Department.',
        },
        {
          id: 't2',
          name: 'David Lee',
          english_name: 'David',
          chinese_name: '李',
          email: 'dehoulworker+davidlee@gmail.com',
          subject: 'Science',
          phone: '016-789 0123',
          description: 'Science and Physics Teacher.',
        },
      ],
      classes: [
        {
          id: 'c1',
          name: 'Grade 10 Mathematics A',
          teacher_id: 't1',
          location_id: 'l1',
          grade: '10',
          default_schedule: '{"dayOfWeek": "Monday", "time": "09:00"}',
        },
        {
          id: 'c2',
          name: 'Grade 10 Science B',
          teacher_id: 't2',
          location_id: 'l2',
          grade: '10',
          default_schedule: '{"dayOfWeek": "Wednesday", "time": "11:00"}',
        },
      ],
      students: [
        {
          id: 's1',
          name: 'Ali Ahmad',
          parent_id: 'u_p1',
          class_ids: '["c1", "c2"]',
          attendance: 95,
          at_risk: 0,
          school: 'City High School',
          parent_name: 'Mr. Ahmad',
          relationship: 'Father',
          emergency_contact: '012-111 2222',
          parent_email: 'dehoulworker+ali@gmail.com',
        },
        {
          id: 's2',
          name: 'Ben Wong',
          parent_id: 'u_p2',
          class_ids: '["c1"]',
          attendance: 88,
          at_risk: 0,
          school: 'Valley International',
          parent_name: 'Mrs. Wong',
          relationship: 'Mother',
          emergency_contact: '013-333 4444',
          parent_email: 'dehoulworker+ben@gmail.com',
        },
      ],
      sessions: [],
      attendance: [],
      scores: [],
      behaviors: [],
      student_insights: [],
    };
  }

  prepare(sql) {
    const self = this;
    return {
      bind: (...args) => ({
        first: async () => self.queryFirst(sql, args),
        all: async () => self.queryAll(sql, args),
        run: async () => self.queryRun(sql, args),
      }),
      first: async () => self.queryFirst(sql, []),
      all: async () => self.queryAll(sql, []),
      run: async () => self.queryRun(sql, []),
    };
  }

  queryFirst(sql, args) {
    // Handle user queries with various column selections
    if (sql.includes('FROM users WHERE email')) {
      return this.data.users.find((u) => u.email === args[0]);
    }
    if (sql.includes('FROM users WHERE id')) {
      return this.data.users.find((u) => u.id === args[0]);
    }
    if (sql.includes('FROM teachers WHERE id')) {
      return this.data.teachers.find((t) => t.id === args[0]);
    }
    if (sql.includes('FROM students WHERE id')) {
      return this.data.students.find((s) => s.id === args[0]);
    }
    if (sql.includes('FROM classes WHERE id')) {
      return this.data.classes.find((c) => c.id === args[0]);
    }
    if (sql.includes('FROM students WHERE parent_id')) {
      return this.data.students.find((s) => s.parent_id === args[0]);
    }
    if (sql.includes('SELECT * FROM settings')) {
      return this.data.settings[0];
    }
    return null;
  }

  queryAll(sql) {
    // Handle users queries (both SELECT * and specific columns)
    if (sql.includes('FROM users')) {
      return { results: this.data.users };
    }
    if (sql.includes('SELECT * FROM locations') || sql.includes('FROM locations')) {
      return { results: this.data.locations };
    }
    if (sql.includes('SELECT * FROM teachers') || sql.includes('FROM teachers')) {
      return { results: this.data.teachers };
    }
    if (sql.includes('SELECT * FROM classes') || sql.includes('FROM classes')) {
      return { results: this.data.classes };
    }
    if (sql.includes('SELECT * FROM students') || sql.includes('FROM students')) {
      return { results: this.data.students };
    }
    if (sql.includes('SELECT * FROM sessions') || sql.includes('FROM sessions')) {
      return { results: this.data.sessions };
    }
    if (sql.includes('SELECT * FROM attendance') || sql.includes('FROM attendance')) {
      return { results: this.data.attendance };
    }
    if (sql.includes('SELECT * FROM scores') || sql.includes('FROM scores')) {
      return { results: this.data.scores };
    }
    if (sql.includes('SELECT * FROM behaviors') || sql.includes('FROM behaviors')) {
      return { results: this.data.behaviors };
    }
    if (sql.includes('SELECT * FROM student_insights') || sql.includes('FROM student_insights')) {
      return { results: this.data.student_insights };
    }
    return { results: [] };
  }

  queryRun(sql, args) {
    if (sql.includes('INSERT INTO users')) {
      const user = {
        id: args[0],
        name: args[1],
        email: args[2],
        password: args[3],
        password_hash: args[4],
        role: args[5],
        must_change_password: args[6] ?? 0,
      };
      this.data.users.push(user);
      return { success: true };
    }
    if (sql.includes('INSERT INTO locations')) {
      const location = {
        id: args[0],
        name: args[1],
        address: args[2],
      };
      this.data.locations.push(location);
      return { success: true };
    }
    if (sql.includes('INSERT INTO teachers')) {
      const teacher = {
        id: args[0],
        name: args[1],
        english_name: args[2],
        chinese_name: args[3],
        email: args[4],
        subject: args[5],
        phone: args[6],
        description: args[7],
      };
      this.data.teachers.push(teacher);
      return { success: true };
    }
    if (sql.includes('INSERT INTO classes')) {
      const cls = {
        id: args[0],
        name: args[1],
        teacher_id: args[2],
        location_id: args[3],
        grade: args[4],
        default_schedule: args[5],
      };
      this.data.classes.push(cls);
      return { success: true };
    }
    if (sql.includes('INSERT INTO students')) {
      const student = {
        id: args[0],
        name: args[1],
        parent_id: args[2],
        class_ids: args[3],
        attendance: args[4],
        at_risk: args[5],
        school: args[6],
        parent_name: args[7],
        relationship: args[8],
        emergency_contact: args[9],
        parent_email: args[10],
      };
      this.data.students.push(student);
      return { success: true };
    }
    if (sql.includes('INSERT INTO sessions')) {
      const session = {
        id: args[0],
        class_id: args[1],
        date: args[2],
        start_time: args[3],
        type: args[4],
        status: args[5],
        target_student_ids: args[6],
      };
      this.data.sessions.push(session);
      return { success: true };
    }
    if (sql.includes('INSERT INTO attendance')) {
      const attendance = {
        id: args[0],
        student_id: args[1],
        session_id: args[2],
        status: args[3],
        reason: args[4],
      };
      this.data.attendance.push(attendance);
      return { success: true };
    }
    if (sql.includes('INSERT INTO scores')) {
      const score = {
        id: this.data.scores.length + 1,
        student_id: args[0],
        date: args[1],
        subject: args[2],
        value: args[3],
        type: args[4],
      };
      this.data.scores.push(score);
      return { success: true };
    }
    if (sql.includes('INSERT INTO behaviors')) {
      const behavior = {
        id: this.data.behaviors.length + 1,
        student_id: args[0],
        session_id: args[1],
        date: args[2],
        category: args[3],
        rating: args[4],
      };
      this.data.behaviors.push(behavior);
      return { success: true };
    }
    if (sql.includes('DELETE FROM teachers')) {
      this.data.teachers = this.data.teachers.filter((t) => t.id !== args[0]);
      return { success: true };
    }
    if (sql.includes('DELETE FROM users')) {
      this.data.users = this.data.users.filter((u) => u.id !== args[0]);
      return { success: true };
    }
    if (sql.includes('DELETE FROM students')) {
      this.data.students = this.data.students.filter((s) => s.id !== args[0]);
      return { success: true };
    }
    if (sql.includes('UPDATE settings')) {
      this.data.settings[0] = {
        ...this.data.settings[0],
        dashboard_insight: args[0],
        last_analyzed: args[1],
        insight_auto_update_hours: args[2],
      };
      return { success: true };
    }
    return { success: true };
  }
}
