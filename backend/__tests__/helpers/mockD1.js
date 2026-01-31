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
          id: 't1',
          name: 'Sarah Jenkins',
          email: 'sarahjenkins@edu.com',
          password: '123',
          password_hash: null, // Set to null to use plain password comparison in tests
          role: 'TEACHER',
          must_change_password: 1,
        },
        {
          id: 'u_p1',
          name: 'Mr. Ahmad',
          email: 'ahmad@edu.com',
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
        email: 'sarahjenkins@edu.com',
        subject: 'Mathematics',
        subjects: '["Mathematics"]',
        subject_levels: '[{"subject":"Mathematics","levels":["Upper Secondary"]}]',
        levels: '["Upper Secondary"]',
        phone: '012-345 6789',
        description: 'Head of Mathematics Department.',
      },
      {
        id: 't2',
        name: 'David Lee',
        english_name: 'David',
        chinese_name: '李',
        email: 'davidlee@edu.com',
        subject: 'Science',
        subjects: '["Science", "Physics"]',
        subject_levels: '[{"subject":"Science","levels":["Upper Secondary"]},{"subject":"Physics","levels":["Science Club"]}]',
        levels: '["Upper Secondary", "Science Club"]',
        phone: '016-789 0123',
        description: 'Science and Physics Teacher.',
      },
      ],
      classes: [
      {
        id: 'c1',
        name: 'Form 4 Mathematics A',
        teacher_id: 't1',
        grade: 'Form 4',
        default_schedule: '{"days": ["Monday"], "time": "09:00", "durationMinutes": 60}',
      },
      {
        id: 'c2',
        name: 'Form 4 Science B',
        teacher_id: 't2',
        grade: 'Form 4',
        default_schedule: '{"days": ["Wednesday"], "time": "11:00", "durationMinutes": 60}',
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
        parent_email: 'ahmad@edu.com',
        address: 'Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur',
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
        parent_email: 'benwong@edu.com',
        address: 'Jalan Yong Shook Lin, PJ New Town, 46200 Petaling Jaya',
      },
      ],
      sessions: [],
      rating_categories: [
        { id: 1, name: 'Attention', description: 'Focus and concentration', created_at: '2023-01-01T00:00:00.000Z' },
        { id: 2, name: 'Participation', description: 'Level of engagement', created_at: '2023-01-01T00:00:00.000Z' },
        { id: 3, name: 'Homework', description: 'Homework completion and quality', created_at: '2023-01-01T00:00:00.000Z' },
        { id: 4, name: 'Behavior', description: 'General conduct', created_at: '2023-01-01T00:00:00.000Z' },
        { id: 5, name: 'Practice', description: 'Practice habits and effort', created_at: '2023-01-01T00:00:00.000Z' },
      ],
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
    if (sql.includes('FROM scores WHERE id')) {
      return this.data.scores.find((score) => score.id === args[0]);
    }
    if (sql.includes('FROM scores WHERE student_id')) {
      const [studentId, date, subject, type] = args;
      return this.data.scores.find((score) => {
        if (!score || !score.student_id) return false;
        return (
          score.student_id === studentId &&
          score.date === date &&
          score.subject === subject &&
          score.type === type
        );
      });
    }
    if (sql.includes('FROM student_insights')) {
      if (sql.includes('student_id = ?') && sql.includes('report_month_key = ?')) {
        const [studentId, reportMonthKey] = args;
        return this.data.student_insights.find(
          (si) => si.student_id === studentId && si.report_month_key === reportMonthKey
        );
      }
      if (sql.includes('student_id = ?')) {
        const [studentId] = args;
        return this.data.student_insights.find((si) => si.student_id === studentId);
      }
    }
    if (sql.includes('FROM students WHERE parent_id')) {
      return this.data.students.find((s) => s.parent_id === args[0]);
    }
    if (sql.includes('SELECT * FROM settings')) {
      return this.data.settings[0];
    }
    if (sql.includes('FROM student_insights')) {
      if (sql.includes('student_id = ?') && sql.includes('report_month_key = ?')) {
        const [studentId, reportMonthKey] = args;
        return this.data.student_insights.find(
          (si) => si.student_id === studentId && si.report_month_key === reportMonthKey
        );
      }
      if (sql.includes('student_id = ?')) {
        const [studentId] = args;
        return this.data.student_insights.find((si) => si.student_id === studentId);
      }
    }
    if (sql.includes('COUNT(*) AS total FROM rating_categories')) {
      return { total: this.data.rating_categories.length };
    }
    if (sql.includes('FROM rating_categories WHERE name')) {
      return this.data.rating_categories.find((category) => category.name === args[0]);
    }
    if (sql.includes('FROM rating_categories WHERE id')) {
      const id = Number(args[0]);
      return this.data.rating_categories.find((category) => category.id === id);
    }
    return null;
  }

  queryAll(sql, args = []) {
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
    if (sql.includes('FROM sessions')) {
      if (sql.includes('WHERE date >=')) {
        const [start, end] = args;
        const filtered = this.data.sessions.filter((session) => {
          if (start && session.date < start) return false;
          if (end && session.date > end) return false;
          return true;
        });
        return { results: filtered };
      }
      return { results: this.data.sessions };
    }
    if (sql.includes('FROM rating_categories')) {
      return { results: this.data.rating_categories };
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
    if (sql.includes('DELETE FROM sessions WHERE date >=')) {
      const [start, end] = args;
      this.data.sessions = this.data.sessions.filter((session) => session.date < start || session.date > end);
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
        subjects: args[6],
        subject_levels: args[7],
        levels: args[8],
        phone: args[9],
        description: args[10],
      };
      this.data.teachers.push(teacher);
      return { success: true };
    }
    if (sql.includes('INSERT INTO classes')) {
      const cls = {
        id: args[0],
        name: args[1],
        teacher_id: args[2],
        grade: args[3],
        default_schedule: args[4],
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
        address: args[11],
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
        duration_minutes: args[4],
        type: args[5],
        status: args[6],
        target_student_ids: args[7],
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
        teacher_id: args[4],
        type: args[5],
        remark: args[6],
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
        teacher_id: args[4],
        rating: args[5],
      };
      this.data.behaviors.push(behavior);
      return { success: true };
    }
    if (
      sql.includes('INSERT INTO rating_categories') ||
      sql.includes('INSERT OR IGNORE INTO rating_categories')
    ) {
      const nextId = Math.max(0, ...this.data.rating_categories.map((cat) => cat.id)) + 1;
      const category = {
        id: nextId,
        name: args[0],
        description: args[1],
        created_at: new Date().toISOString(),
      };
      this.data.rating_categories.push(category);
      return { success: true };
    }
    if (sql.includes('DELETE FROM teachers')) {
      this.data.teachers = this.data.teachers.filter((t) => t.id !== args[0]);
      return { success: true };
    }
    if (sql.includes('DELETE FROM classes')) {
      const classId = args[0];
      this.data.classes = this.data.classes.filter((c) => c.id !== classId);
      this.data.students = this.data.students.map((student) => {
        let classIds = [];
        try {
          classIds = JSON.parse(student.class_ids || '[]');
        } catch {
          classIds = [];
        }
        if (!Array.isArray(classIds)) classIds = [];
        if (!classIds.includes(classId)) {
          return student;
        }
        const updatedIds = classIds.filter((cid) => cid !== classId);
        return { ...student, class_ids: JSON.stringify(updatedIds) };
      });
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
    if (sql.includes('DELETE FROM rating_categories')) {
      const id = Number(args[0]);
      this.data.rating_categories = this.data.rating_categories.filter((category) => category.id !== id);
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
    if (sql.includes('UPDATE rating_categories')) {
      const id = Number(args[2]);
      const existing = this.data.rating_categories.find((category) => category.id === id);
      if (existing) {
        existing.name = args[0];
        existing.description = args[1];
      }
      return { success: true };
    }
    if (sql.includes('UPDATE student_insights')) {
      const [insights, lastAnalyzed, studentId, reportMonthKey] = args;
      const existing = this.data.student_insights.find(
        (si) => si.student_id === studentId && si.report_month_key === reportMonthKey
      );
      if (existing) {
        existing.insights = insights;
        existing.last_analyzed = lastAnalyzed;
      }
      return { success: true };
    }
    if (sql.includes('INSERT INTO student_insights')) {
      const [studentId, reportMonthKey, insights, lastAnalyzed] = args;
      const row = {
        id: this.data.student_insights.length + 1,
        student_id: studentId,
        report_month_key: reportMonthKey,
        insights,
        last_analyzed: lastAnalyzed,
      };
      this.data.student_insights.push(row);
      return { success: true };
    }
    return { success: true };
  }
}
