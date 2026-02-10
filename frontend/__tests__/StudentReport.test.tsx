import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { StudentReport } from '../views/shared/StudentReport';
import { TRANSLATIONS } from '../constants';
import { User, Student, ClassGroup, Score, BehaviorRating, Session, AttendanceRecord, Teacher, RatingCategory } from '../types';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/backendApi', () => ({
  api: {
    saveStudentInsight: vi.fn().mockResolvedValue(undefined),
    fetchStudentInsight: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../services/aiService', () => ({
  generateStudentInsights: vi.fn().mockResolvedValue([]),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('StudentReport exam coverage', () => {
  const t = TRANSLATIONS.en;
  const student: Student = {
    id: 's1',
    name: 'Ali Ahmad',
    parentId: 'p1',
    classIds: ['c1'],
    attendance: 100,
    atRisk: false,
    school: 'City High School',
    parentName: 'Mr. Ahmad',
    relationship: 'Father',
    emergencyContact: '012-0000000',
    parentEmail: 'parent@example.com',
    address: 'Jalan Test 123'
  };

  const user: User = { id: 'u1', name: 'HQ Admin', role: 'HQ' };
  const classes: ClassGroup[] = [
    { id: 'c1', name: 'Form 4 Math', teacherId: 't1', grade: 'Form 4' }
  ];
  const teacher: Teacher = {
    id: 't1',
    name: 'Sarah Jenkins',
    email: 'sarah@edu.com',
    subject: 'Mathematics',
    subjects: ['Mathematics'],
    levels: ['Form 4'],
  };

  const scores: Score[] = [
    {
      studentId: 's1',
      date: '2025-03-01',
      subject: 'Math',
      value: 92,
      type: 'EXAM',
      teacherId: 't1',
      remark: 'Strong grasp of algebra.',
    },
    {
      studentId: 's1',
      date: '2025-03-05',
      subject: 'Science',
      value: 85,
      type: 'EXAM',
      teacherId: 't1'
    },
    {
      studentId: 's1',
      date: '2025-03-10',
      subject: 'Math',
      value: 88,
      type: 'HOMEWORK',
      teacherId: 't1'
    },
  ];

  const behaviors: BehaviorRating[] = [];
  const sessions: Session[] = [];
  const attendance: AttendanceRecord[] = [];
  const ratingCategories: RatingCategory[] = [];

  it('shows exam breakdown sections, remarks, and parent-friendly summary when scores exist', async () => {
    const { container } = render(
      <MemoryRouter>
        <StudentReport
          t={t}
          user={user}
          students={[student]}
          classes={classes}
          scores={scores}
          behaviors={behaviors}
          sessions={sessions}
          attendance={attendance}
          teachers={[teacher]}
          ratingCategories={ratingCategories}
        />
      </MemoryRouter>
    );

    await screen.findByText(/Monthly Learning Summary/i);
    expect(container.querySelector('[data-cy="report-month-select"]')).toBeInTheDocument();
    expect(screen.getByText(/Edit Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Subject Records/i)).toBeInTheDocument();
    expect(screen.getByText(/monthly performance highlights are being prepared/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Performance/i)).toBeInTheDocument();
    expect(container.querySelector('button[data-cy="subject-card"][data-subject="Math"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-cy="subject-card"][data-subject="Science"]')).toBeInTheDocument();
    expect(screen.getByText(/Remarked/i)).toBeInTheDocument();
    expect(screen.getByText(/Attendance Overview/i)).toBeInTheDocument();
  });
});
