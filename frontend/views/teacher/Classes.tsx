import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, MoreHorizontal, CalendarClock, XCircle, UserCheck } from 'lucide-react';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, Button, Dropdown, DropdownItem, Dialog, Input, cn } from '../../components/ui';
import { ClassGroup, Session, Student, BehaviorRating, RatingCategory, AttendanceRecord } from '../../types';
import { api } from '../../services/backendApi';

interface TeacherClassesProps {
  t: any;
  classes: ClassGroup[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  students: Student[];
  behaviors: BehaviorRating[];
  setBehaviors: (behaviors: BehaviorRating[]) => void;
  attendance: AttendanceRecord[];
  setAttendance: (attendance: AttendanceRecord[]) => void;
  ratingCategories: RatingCategory[];
}

const DEFAULT_CATEGORIES = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];
const LEAVE_REASONS = ['Sick Leave', 'Personal Leave', 'School Event', 'Unexcused', 'Other'];

export const TeacherClasses: React.FC<TeacherClassesProps> = ({
  t,
  classes,
  selectedClassId,
  onSelectClass,
  sessions,
  setSessions,
  students,
  behaviors,
  setBehaviors,
  attendance,
  setAttendance,
  ratingCategories,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Reschedule State
  const [isRescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  // Performance Rating State
  const [isPerformanceOpen, setPerformanceOpen] = useState(false);
  const [performanceSession, setPerformanceSession] = useState<Session | null>(null);
  const [tempBehaviors, setTempBehaviors] = useState<Record<string, Record<string, number | null>>>({}); // studentId -> { category -> rating }
  const [tempAttendance, setTempAttendance] = useState<Record<string, { status: 'PRESENT' | 'ABSENT'; reason?: string }>>({});

  // 1. Filter sessions for selected class
  const classSessions = useMemo(() => {
    return sessions
      .filter(s => s.classId === selectedClassId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, selectedClassId]);

  // 2. Extract months
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    classSessions.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [classSessions]);

  // 3. Set default month
  useEffect(() => {
    if (monthOptions.length > 0) {
       if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
          setSelectedMonth(monthOptions[0]);
       }
    } else {
        setSelectedMonth('');
    }
  }, [monthOptions, selectedMonth]);

  // 4. Filter by month
  const displayedSessions = useMemo(() => {
     if (!selectedMonth) return [];
     return classSessions.filter(s => s.date.startsWith(selectedMonth));
  }, [classSessions, selectedMonth]);

  // --- Formatters ---
  const formatMonth = (m: string) => {
      if (!m) return '';
      const [y, mon] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mon)-1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day}-${month}-${year}`; // DD-MMM-YYYY
  };

  const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`; // HH:MM am/pm
  };

  // Specific formatter for Dialog Title: 30 Dec 2024
  const formatDateForTitle = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isFutureSession = (session: Session) => {
      const todayUTC = new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      ));
      const sessionUTC = new Date(`${session.date}T00:00:00Z`);
      return sessionUTC > todayUTC;
  };

  // --- Handlers ---

  const handleOpenReschedule = (session: Session) => {
      setSelectedSession(session);
      setRescheduleData({ date: session.date, time: session.startTime });
      setRescheduleOpen(true);
  };

  const handleOpenPerformance = (session: Session) => {
      setPerformanceSession(session);
      
      const relevantBehaviors = behaviors.filter(b => b.sessionId === session.id);
      const relevantAttendance = attendance.filter(a => a.sessionId === session.id);
      const loaded: Record<string, Record<string, number>> = {};
      const attendanceLoaded: Record<string, { status: 'PRESENT' | 'ABSENT'; reason?: string }> = {};
      
      // Determine students for this session to set defaults
      const allClassStudents = students.filter(s => (s.classIds || []).includes(selectedClassId));
      let targetList = allClassStudents;
      if (session.targetStudentIds && session.targetStudentIds.length > 0) {
          targetList = allClassStudents.filter(s => session.targetStudentIds?.includes(s.id));
      }

      targetList.forEach(student => {
          if (!loaded[student.id]) loaded[student.id] = {};
          categories.forEach(cat => {
               const found = relevantBehaviors.find(b => b.studentId === student.id && b.category === cat);
               // Default to 5 so ratings are pre-filled
               loaded[student.id][cat] = found ? found.rating : 5;
          });
          const att = relevantAttendance.find(a => a.studentId === student.id);
          attendanceLoaded[student.id] = att
            ? { status: att.status as 'PRESENT' | 'ABSENT', reason: att.reason }
            : { status: 'PRESENT' };
      });

      setTempBehaviors(loaded);
      setTempAttendance(attendanceLoaded);
      setPerformanceOpen(true);
  };

  const handleCancelSession = async (session: Session) => {
      if (!window.confirm("Are you sure you want to cancel this session?")) return;
      const updated = sessions.map(s => s.id === session.id ? { ...s, status: 'CANCELLED' as const } : s);
      setSessions(updated);
      try {
        await api.updateSessionStatus(session.id, 'CANCELLED');
      } catch (err: any) {
        // If session does not exist in backend (future auto-generated), skip remote update
        if (typeof err?.message === 'string' && err.message.includes('Not Found')) {
          console.warn('Session not found in backend; kept local cancellation.');
        } else {
          console.error('Failed to cancel session', err);
          setSessions(sessions); // revert if real failure
          throw err;
        }
      }
  };

  const confirmReschedule = async () => {
      if (!selectedSession || !rescheduleData.date || !rescheduleData.time) return;
      
      // 1. Cancel old session (best-effort)
      try {
        await api.updateSessionStatus(selectedSession.id, 'CANCELLED');
      } catch (err: any) {
        if (typeof err?.message === 'string' && err.message.includes('Not Found')) {
          console.warn('Session not found in backend; skipping remote cancel.');
        } else {
          console.error('Failed to cancel session', err);
        }
      }
      
      // 2. Create new session
      const newSession: Session = {
          id: `ses_res_${Date.now()}`,
          classId: selectedSession.classId,
          date: rescheduleData.date,
          startTime: rescheduleData.time,
          type: 'SPECIAL',
          status: 'SCHEDULED',
          targetStudentIds: selectedSession.targetStudentIds
      };
      await api.createSession(newSession);

      // 3. Update State
      const updatedSessions = sessions.map(s => s.id === selectedSession.id ? { ...s, status: 'CANCELLED' as const } : s);
      setSessions([...updatedSessions, newSession]);
      setRescheduleOpen(false);
  };

  const updateRating = (studentId: string, category: string, value: number) => {
      if (tempAttendance[studentId]?.status === 'ABSENT') return;
      setTempBehaviors(prev => ({
          ...prev,
          [studentId]: {
              ...(prev[studentId] || {}),
              [category]: value
          }
      }));
  };

  const savePerformance = async () => {
      if (!performanceSession) return;
      
      // Ensure the session exists in backend before posting attendance/behaviors (best effort)
      try {
        await api.createSession({
          ...performanceSession,
          type: performanceSession.type || 'REGULAR',
          status: performanceSession.status || 'SCHEDULED',
        } as Session);
      } catch (err: any) {
        if (typeof err?.message === 'string' && err.message.toLowerCase().includes('unique')) {
          // Already exists, safe to proceed
        } else {
          console.warn('createSession preflight failed, proceeding assuming session exists', err);
        }
      }

      const newBehaviors: BehaviorRating[] = [];
      const newAttendance: AttendanceRecord[] = [];
      const timestamp = new Date().toISOString();

      Object.entries(tempBehaviors).forEach(([studentId, ratings]) => {
          const attendanceStatus = tempAttendance[studentId]?.status || 'PRESENT';
          const reason = tempAttendance[studentId]?.reason;
          newAttendance.push({
            id: `att_${performanceSession.id}_${studentId}`,
            sessionId: performanceSession.id,
            studentId,
            status: attendanceStatus,
            reason,
            date: timestamp,
          });

          if (attendanceStatus === 'ABSENT') {
            return;
          }

          Object.entries(ratings).forEach(([category, rating]) => {
              if (rating === null || rating === undefined) return;
              newBehaviors.push({
                  studentId,
                  sessionId: performanceSession.id,
                  date: timestamp,
                  category: category as any,
                  rating
              });
          });
      });

      // Optimistically update local state immediately to reflect changes in UI
      const cleanedBehaviors = behaviors.filter(b => b.sessionId !== performanceSession.id);
      const cleanedAttendance = attendance.filter(a => a.sessionId !== performanceSession.id);
      setBehaviors([...cleanedBehaviors, ...newBehaviors]);
      setAttendance([...cleanedAttendance, ...newAttendance]);
      setPerformanceOpen(false);

      // Persist to DB via API (Parallelized for speed)
      const attendanceResults = await Promise.allSettled(
        newAttendance.map(a => api.recordAttendance(a))
      );
      const behaviorResults = await Promise.allSettled(
        newBehaviors.map(b => api.recordBehavior(b))
      );

      const fatalError = [...attendanceResults, ...behaviorResults].find(
        (r) => r.status === 'rejected' &&
          !(
            typeof (r as PromiseRejectedResult).reason?.message === 'string' &&
            ((r as PromiseRejectedResult).reason.message.includes('Not Found') ||
             (r as PromiseRejectedResult).reason.message.includes('foreign key constraint') ||
             (r as PromiseRejectedResult).reason.message.toLowerCase().includes('unique')))
      );
      if (fatalError) {
        throw (fatalError as PromiseRejectedResult).reason;
      }

      // Mark session as completed once performance data is saved
      try {
        await api.updateSessionStatus(performanceSession.id, 'COMPLETED');
        setSessions((prev) =>
          prev.map((s) => (s.id === performanceSession.id ? { ...s, status: 'COMPLETED' as const } : s))
        );
      } catch (statusErr) {
        console.warn('Failed to mark session as completed', statusErr);
      }
  };

  const categories = ratingCategories.length > 0
    ? ratingCategories.map((category) => category.name)
    : DEFAULT_CATEGORIES;

  // Students for Performance Dialog
  const sessionStudents = useMemo(() => {
      if (!performanceSession) return [];
      const allClassStudents = students.filter(s => (s.classIds || []).includes(selectedClassId));
      if (performanceSession.targetStudentIds && performanceSession.targetStudentIds.length > 0) {
          return allClassStudents.filter(s => performanceSession.targetStudentIds?.includes(s.id));
      }
      return allClassStudents;
  }, [students, selectedClassId, performanceSession]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
       {/* Header Controls */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-1 w-full md:w-auto">
               <h2 className="text-2xl font-bold tracking-tight">Class Sessions</h2>
               <div className="flex flex-col md:flex-row gap-3 pt-2 w-full md:w-[500px]">
                   {/* Class Selector */}
                   <Select
                     value={selectedClassId}
                     onChange={(e) => onSelectClass(e.target.value)}
                     className="bg-background flex-1 h-10"
                   >
                     {classes.length === 0 && <option value="">{t.noClassesAvailable}</option>}
                     {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </Select>

                   {/* Month Selector */}
                   <Select
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="bg-background flex-1 h-10"
                     disabled={monthOptions.length === 0}
                   >
                      {monthOptions.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                      {monthOptions.length === 0 && <option>No sessions</option>}
                   </Select>
               </div>
            </div>
       </div>

       {/* Desktop Table View */}
       <Card className="hidden md:block overflow-visible border shadow-sm">
          <Table wrapperClassName="overflow-visible">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.time}</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[340px]">{t.actions || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{formatDate(session.date)}</TableCell>
                  <TableCell>{formatTime(session.startTime)}</TableCell>
                  <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{session.type}</Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={
                          session.status === 'COMPLETED' ? 'secondary' : 
                          session.status === 'CANCELLED' ? 'destructive' : 'outline'
                      } className={
                          session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-transparent' : ''
                      }>
                          {t[session.status.toLowerCase()] || session.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                            size="sm" 
                            variant="default" // Force black
                            disabled={isFutureSession(session)}
                            onClick={() => handleOpenPerformance(session)}
                            className="h-8 gap-2 bg-black text-white hover:bg-black/90 shadow-sm"
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            Performance
                        </Button>
                        <Button 
                            size="sm" 
                            variant={session.status === 'CANCELLED' ? 'ghost' : 'outline'}
                            disabled={session.status === 'CANCELLED' || session.status === 'COMPLETED'}
                            onClick={() => handleOpenReschedule(session)}
                            className="h-8 gap-2 text-muted-foreground"
                        >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Reschedule
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
              {displayedSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {classes.length === 0 ? t.noClassesAvailable : t.noData}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
       </Card>

       {/* Mobile List View */}
       <div className="md:hidden space-y-4 pb-24">
          {displayedSessions.map(session => (
            <Card key={session.id} className="p-4 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-muted-foreground" />
                       <span className="font-semibold text-base">{formatDate(session.date)}</span>
                   </div>
                   <Badge variant={
                          session.status === 'COMPLETED' ? 'secondary' : 
                          session.status === 'CANCELLED' ? 'destructive' : 'outline'
                      } className={
                          session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-transparent' : ''
                      }>
                          {t[session.status.toLowerCase()] || session.status}
                   </Badge>
               </div>
               
               <div className="flex justify-between items-center text-sm text-muted-foreground">
                   <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4" />
                       <span className="font-medium">{formatTime(session.startTime)}</span>
                   </div>
                   <div className="uppercase text-[10px] font-bold tracking-wider bg-muted px-2 py-0.5 rounded">
                       {session.type}
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                        size="sm" 
                        variant="default" // Force black
                        disabled={isFutureSession(session)}
                        onClick={() => handleOpenPerformance(session)}
                        className="w-full text-xs h-10 bg-black text-white hover:bg-black/90 shadow-sm"
                    >
                       Performance
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        disabled={session.status !== 'SCHEDULED'}
                        onClick={() => handleOpenReschedule(session)}
                        className="w-full text-xs h-10"
                    >
                        Reschedule
                    </Button>
               </div>
            </Card>
          ))}
          {displayedSessions.length === 0 && (
             <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                {classes.length === 0 ? t.noClassesAvailable : t.noData}
             </div>
          )}
       </div>

       {/* Reschedule Dialog */}
       <Dialog
            isOpen={isRescheduleOpen}
            onClose={() => setRescheduleOpen(false)}
            title="Reschedule Session"
            footer={
                <>
                    <Button variant="outline" onClick={() => setRescheduleOpen(false)} className="flex-1 sm:flex-none">{t.cancel}</Button>
                    {selectedSession?.status !== 'CANCELLED' && (
                        <Button 
                            variant="destructive" 
                            onClick={() => { handleCancelSession(selectedSession!); setRescheduleOpen(false); }}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel Session
                        </Button>
                    )}
                    <Button onClick={confirmReschedule} className="flex-1 sm:flex-none">Reschedule</Button>
                </>
            }
        >
            <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">Select a new date and time for this session. The current session will be marked as cancelled.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.date}</label>
                        <Input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.time}</label>
                        <Input type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})} />
                    </div>
                </div>
            </div>
        </Dialog>

        {/* Student Performance Dialog */}
        <Dialog
            isOpen={isPerformanceOpen}
            onClose={() => setPerformanceOpen(false)}
            title={
                <div className="text-center w-full">
                    <div className="text-xl font-bold">Student Performance</div>
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                        {performanceSession ? formatDateForTitle(performanceSession.date) : ''}
                    </div>
                </div>
            }
            footer={
                <>
                    <Button variant="outline" onClick={() => setPerformanceOpen(false)} className="flex-1 sm:flex-none">{t.cancel}</Button>
                    <Button onClick={savePerformance} className="flex-1 sm:flex-none">{t.save}</Button>
                </>
            }
            className="max-w-2xl"
        >
            <div className="space-y-4 py-2">
                        {sessionStudents.map(student => (
                            <Card
                                key={student.id}
                                className="p-4 border shadow-sm"
                                data-student-id={student.id}
                                data-student-name={student.name}
                            >
                        <div className="flex items-center gap-3 mb-4 border-b pb-3">
                            <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                                {student.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{student.name}</h3>
                                <p className="text-xs text-muted-foreground">Mark attendance and optionally rate performance</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {categories.map(cat => (
                                <div key={cat} data-category={cat} className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">{cat}</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map(value => {
                                            const isSelected = tempBehaviors[student.id]?.[cat] === value;
                                            const isDisabled = tempAttendance[student.id]?.status === 'ABSENT';
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => updateRating(student.id, cat, value)}
                                                    className={cn(
                                                        "h-10 w-full rounded-lg border text-base font-semibold transition",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                                                        isDisabled ? "opacity-50 cursor-not-allowed" :
                                                        isSelected
                                                            ? "bg-black text-white border-black"
                                                            : "bg-white text-black border-gray-200 hover:border-black"
                                                    )}
                                                    disabled={isDisabled}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <Button
                              variant={tempAttendance[student.id]?.status === 'PRESENT' ? 'default' : 'outline'}
                              size="sm"
                              className="h-11 w-full text-sm font-semibold"
                              onClick={() => {
                                setTempAttendance(prev => ({
                                  ...prev,
                                  [student.id]: { status: 'PRESENT' },
                                }));
                              }}
                            >
                              Present
                            </Button>
                            <Button
                              variant={tempAttendance[student.id]?.status === 'ABSENT' ? 'destructive' : 'outline'}
                              size="sm"
                              className="h-11 w-full text-sm font-semibold"
                              onClick={() => {
                                setTempAttendance(prev => ({
                                  ...prev,
                                  [student.id]: { status: 'ABSENT', reason: prev[student.id]?.reason },
                                }));
                                setTempBehaviors(prev => ({
                                  ...prev,
                                  [student.id]: { ...(prev[student.id] || {}) },
                                }));
                              }}
                            >
                              Absent
                            </Button>
                          </div>
                          {tempAttendance[student.id]?.status === 'ABSENT' && (
                            <div className="w-full">
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reason for Absence</label>
                              <Select
                                value={tempAttendance[student.id]?.reason || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setTempAttendance(prev => ({
                                    ...prev,
                                    [student.id]: { status: 'ABSENT', reason: value },
                                  }));
                                }}
                                className="h-11 w-full bg-gray-50 border-gray-200 text-sm"
                              >
                                <option value="">Select Reason...</option>
                                {LEAVE_REASONS.map((reason) => (
                                  <option key={reason} value={reason}>{reason}</option>
                                ))}
                              </Select>
                            </div>
                          )}
                        </div>
                    </Card>
                ))}
                {sessionStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground italic">
                        No students enrolled in this class.
                    </div>
                )}
            </div>
        </Dialog>
    </div>
  );
};
