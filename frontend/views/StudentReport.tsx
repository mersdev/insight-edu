import React from 'react';
import { StudentReport as SharedStudentReport } from './shared/StudentReport';
import { User, Student, ClassGroup, Score, BehaviorRating, Session, AttendanceRecord, Teacher, RatingCategory } from '../types';

interface StudentReportProps {
    t: any;
    user: User;
    students: Student[];
    classes: ClassGroup[];
    scores: Score[];
    behaviors: BehaviorRating[];
    sessions: Session[];
    attendance: AttendanceRecord[];
    teachers: Teacher[];
    ratingCategories: RatingCategory[];
}

export const StudentReport: React.FC<StudentReportProps> = (props) => {
    return <SharedStudentReport {...props} />;
};
