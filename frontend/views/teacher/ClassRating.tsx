import React, { useState, useEffect, useMemo } from 'react';
import { Button, cn, Select, Card, Input, Dialog } from '../../components/ui';
import { Student, ClassGroup, Session, AttendanceRecord, BehaviorRating } from '../../types';
import { UserCheck, UserX, CalendarClock, ChevronLeft, ChevronRight, Star, Check, ArrowLeft, RotateCcw } from 'lucide-react';
import { api } from '../../services/backendApi';

interface ClassRatingProps {
  t: any;
  students: Student[];
  classes: ClassGroup[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  behaviors: BehaviorRating[];
  setBehaviors: (records: BehaviorRating[]) => void;
}

type RatingCategory = 'Attention' | 'Participation' | 'Homework' | 'Behavior' | 'Practice';
const CATEGORIES: RatingCategory[] = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];
const LEAVE_REASONS = ['Sick Leave', 'Personal Leave', 'School Event', 'Unexcused', 'Other'];

// Helper for Black/White Star Rating
const StarRatingInput = ({ value, onChange, disabled }: { value: number, onChange: (val: number) => void, disabled?: boolean }) => {
    return (
        <div className={cn("flex items-center gap-3", disabled && "opacity-50 pointer-events-none")}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange(star); }}
                    className="focus:outline-none transition-transform active:scale-90 hover:scale-110 p-1"
                >
                    <Star 
                        className={cn(
                            "w-8 h-8 transition-all", 
                            star <= value ? "fill-black text-black" : "text-gray-200 fill-transparent"
                        )} 
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
};

export const ClassRating: React.FC<ClassRatingProps> = ({ 
    t, students, classes, selectedClassId, onSelectClass, 
    sessions, setSessions, 
    attendance, setAttendance,
    behaviors, setBehaviors
}) => {
  
  // View State: SELECTION -> RATING -> COMPLETED
  const [viewStep, setViewStep] = useState<'SELECTION' | 'RATING' | 'COMPLETED'>('SELECTION');
  
  // Selection State
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Format: YYYY-MM
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Rating Wizard State
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

  // Postpone Dialog State
  const [isPostponeOpen, setPostponeOpen] = useState(false);
  const [postponeData, setPostponeData] = useState({ date: '', time: '' });

  // Data Cache
  const [allRatings, setAllRatings] = useState<Record<string, Record<string, any>>>({});

  // --- Derived Data ---
  
  // 1. Filter Sessions by Class
  const classSessions = useMemo(() => 
    sessions
      .filter(s => s.classId === selectedClassId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [sessions, selectedClassId]);

  // 2. Extract Unique Months for Dropdown
  const monthOptions = useMemo(() => {
      const months = new Set<string>();
      classSessions.forEach(s => {
          const d = new Date(s.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months.add(key);
      });
      return Array.from(months).sort().reverse(); // Newest months first
  }, [classSessions]);

  // 3. Filter Sessions by Selected Month
  const filteredSessions = useMemo(() => {
      if (!selectedMonth) return [];
      return classSessions.filter(s => s.date.startsWith(selectedMonth));
  }, [classSessions, selectedMonth]);

  // 4. Students for current session
  const currentSession = sessions.find(s => s.id === selectedSessionId);
  const targetStudents = useMemo(() => {
      if (!currentSession) return [];
      const allClassStudents = students.filter(s => (s.classIds || []).includes(selectedClassId));
      if (currentSession.targetStudentIds && currentSession.targetStudentIds.length > 0) {
          return allClassStudents.filter(s => currentSession.targetStudentIds?.includes(s.id));
      }
      return allClassStudents;
  }, [students, selectedClassId, currentSession]);

  // --- Effects ---

  // Auto-select first month and session
  useEffect(() => {
      if (monthOptions.length > 0 && !selectedMonth) {
          setSelectedMonth(monthOptions[0]);
      }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
      if (filteredSessions.length > 0) {
          // If previously selected session is not in the new filtered list, select the first one
          if (!filteredSessions.find(s => s.id === selectedSessionId)) {
              setSelectedSessionId(filteredSessions[0].id);
          }
      } else {
          setSelectedSessionId('');
      }
  }, [filteredSessions, selectedSessionId]);

  // Load Ratings when session changes
  useEffect(() => {
    const loadedRatings: Record<string, Record<string, any>> = {};
    if (selectedSessionId) {
        const sessionAttendance = attendance.filter(a => a.sessionId === selectedSessionId);
        sessionAttendance.forEach(a => {
            if (!loadedRatings[a.studentId]) loadedRatings[a.studentId] = {};
            loadedRatings[a.studentId].attendance = a.status.toLowerCase();
            if (a.reason) loadedRatings[a.studentId].absenceReason = a.reason;
        });

        const sessionBehaviors = behaviors.filter(b => b.sessionId === selectedSessionId);
        sessionBehaviors.forEach(b => {
            if (!loadedRatings[b.studentId]) loadedRatings[b.studentId] = {};
            loadedRatings[b.studentId][b.category] = b.rating;
        });

        // Initialize defaults
        Object.keys(loadedRatings).forEach(sId => {
             const r = loadedRatings[sId];
             if (r.attendance === 'present') {
                 CATEGORIES.forEach(cat => {
                     if (r[cat] === undefined) r[cat] = 5;
                 });
             }
        });
    }
    setAllRatings(loadedRatings);
  }, [selectedSessionId, attendance, behaviors]);

  // --- Handlers ---

  const handleStartClass = () => {
      if (!currentSession) return;
      setCurrentStudentIndex(0);
      setViewStep('RATING');
  };

  const handleNextStudent = () => {
      if (currentStudentIndex < targetStudents.length - 1) {
          setCurrentStudentIndex(prev => prev + 1);
          window.scrollTo(0, 0);
      } else {
          setViewStep('COMPLETED');
      }
  };

  const handlePrevStudent = () => {
      if (currentStudentIndex > 0) {
          setCurrentStudentIndex(prev => prev - 1);
      }
  };

  const handleOpenPostpone = () => {
      if (!currentSession) return;
      setPostponeData({ date: currentSession.date, time: currentSession.startTime });
      setPostponeOpen(true);
  };

  const confirmPostpone = () => {
      if (!currentSession || !postponeData.date || !postponeData.time) return;
      
      const newSessionId = `ses_spec_${Date.now()}`;
      const updatedSessions = sessions.map(s => s.id === currentSession.id ? { ...s, status: 'CANCELLED' as const } : s);
      const newSession: Session = {
          id: newSessionId,
          classId: currentSession.classId,
          date: postponeData.date,
          startTime: postponeData.time,
          type: 'SPECIAL',
          status: 'SCHEDULED',
          targetStudentIds: currentSession.targetStudentIds
      };
      
      setSessions([...updatedSessions, newSession]);
      setPostponeOpen(false);
  };

  const handleAttendance = async (studentId: string, status: 'present' | 'absent') => {
      setAllRatings(prev => {
          const studentData = prev[studentId] || {};
          if (status === 'absent') {
             return { ...prev, [studentId]: { ...studentData, attendance: 'absent' } };
          }
          return { 
              ...prev, 
              [studentId]: { 
                  ...studentData, 
                  attendance: 'present', 
                  absenceReason: undefined,
                  // Default ratings if not present
                  Attention: studentData.Attention ?? 5, 
                  Participation: studentData.Participation ?? 5, 
                  Homework: studentData.Homework ?? 5, 
                  Behavior: studentData.Behavior ?? 5, 
                  Practice: studentData.Practice ?? 5 
              } 
          };
      });
      await saveStudentData(studentId, status);
  };

  const handleRating = async (studentId: string, category: RatingCategory, value: number) => {
    setAllRatings(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [category]: value }
    }));
    
    await api.recordBehavior({
        studentId,
        sessionId: selectedSessionId,
        date: new Date().toISOString(),
        category: category,
        rating: value
    });
  };

  const handleReason = (studentId: string, reason: string) => {
       setAllRatings(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], absenceReason: reason }
      }));
      saveStudentData(studentId, undefined, reason);
  };

  const saveStudentData = async (studentId: string, explicitStatus?: 'present' | 'absent', explicitReason?: string) => {
      if (!currentSession || !selectedSessionId) return;
      const ratings = allRatings[studentId] || {};
      const attStatus = explicitStatus || ratings.attendance;
      const reason = explicitReason || ratings.absenceReason;

      if (!attStatus) return;

      const attRecord: AttendanceRecord = {
          id: `att_${selectedSessionId}_${studentId}`,
          studentId: studentId,
          sessionId: selectedSessionId,
          status: attStatus === 'present' ? 'PRESENT' : 'ABSENT',
          reason: attStatus === 'absent' ? reason : undefined
      };
      
      await api.recordAttendance(attRecord);
      
      const existingAttIndex = attendance.findIndex(a => a.id === attRecord.id);
      let newAttendance = [...attendance];
      if (existingAttIndex !== -1) newAttendance[existingAttIndex] = attRecord;
      else newAttendance.push(attRecord);
      setAttendance(newAttendance);
  };

  // --- Formatting Helpers ---
  const formatMonth = (monthStr: string) => {
      if (!monthStr) return "";
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatSession = (s: Session) => {
      const d = new Date(s.date);
      // Format: DD-MM-YYYY / HH:MM am/pm
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      
      // Time format
      let [hours, minutes] = s.startTime.split(':');
      let h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      const strTime = `${h}:${minutes} ${ampm}`;

      return `${day}-${month}-${year} / ${strTime}`;
  };

  // ------------------------------------------
  // RENDER: STEP 1 - CLASS SELECTION
  // ------------------------------------------
  if (viewStep === 'SELECTION') {
      return (
        <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-500 pt-6 px-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-black">Class Rating</h1>
                <p className="text-muted-foreground">Select a class session to begin rating.</p>
            </div>

            <Card className="p-6 space-y-6 shadow-sm border border-gray-200">
                {/* 1. Class Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Class</label>
                    <Select 
                        value={selectedClassId} 
                        onChange={(e) => onSelectClass(e.target.value)}
                        className="h-12 bg-white border-gray-200 focus:border-black focus:ring-black text-base"
                    >
                        {classes.length === 0 && <option value="">{t.noClassesAvailable}</option>}
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>

                {/* 2. Month Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Month</label>
                    <Select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="h-12 bg-white border-gray-200 focus:border-black focus:ring-black text-base"
                        disabled={monthOptions.length === 0}
                    >
                         {monthOptions.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                         {monthOptions.length === 0 && <option>No sessions</option>}
                    </Select>
                </div>

                {/* 3. Session Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Session</label>
                    <Select 
                        value={selectedSessionId} 
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="h-12 bg-white border-gray-200 focus:border-black focus:ring-black text-base"
                        disabled={filteredSessions.length === 0}
                    >
                        {filteredSessions.map(s => <option key={s.id} value={s.id}>{formatSession(s)}</option>)}
                        {filteredSessions.length === 0 && <option>{t.noData}</option>}
                    </Select>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                    <Button 
                        onClick={handleStartClass} 
                        disabled={!currentSession}
                        className="w-full h-12 text-base bg-black text-white hover:bg-gray-800 rounded-lg shadow-md disabled:opacity-50"
                    >
                        Start Class
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={handleOpenPostpone} 
                        disabled={!currentSession}
                        className="w-full h-12 text-base border-2 border-gray-100 text-gray-600 hover:border-black hover:text-black hover:bg-transparent rounded-lg"
                    >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Reschedule Class
                    </Button>
                </div>
            </Card>

            {/* Postpone Dialog */}
            <Dialog
                isOpen={isPostponeOpen}
                onClose={() => setPostponeOpen(false)}
                title={t.rescheduleSession}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setPostponeOpen(false)}>{t.cancel}</Button>
                        <Button onClick={confirmPostpone} className="bg-black text-white hover:bg-black/90">{t.save}</Button>
                    </>
                }
            >
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">{t.sessionCancelledWarning}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-500">{t.date}</label>
                            <Input type="date" className="h-12 border-gray-300" value={postponeData.date} onChange={(e) => setPostponeData({...postponeData, date: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-500">{t.time}</label>
                            <Input type="time" className="h-12 border-gray-300" value={postponeData.time} onChange={(e) => setPostponeData({...postponeData, time: e.target.value})} />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
      );
  }

  // ------------------------------------------
  // RENDER: STEP 2 - RATING WIZARD
  // ------------------------------------------
  if (viewStep === 'RATING') {
      const student = targetStudents[currentStudentIndex];
      const r = allRatings[student.id] || {};
      const isPresent = r.attendance === 'present';
      const isAbsent = r.attendance === 'absent';

      return (
          <div className="min-h-[calc(100vh-80px)] bg-gray-50 pb-24 flex flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-white border-b px-4 py-4 flex items-center justify-between shadow-sm">
                  <Button variant="ghost" size="icon" onClick={() => setViewStep('SELECTION')}>
                      <ArrowLeft className="w-6 h-6 text-black" />
                  </Button>
                  <div className="text-sm font-medium text-muted-foreground">
                      Student {currentStudentIndex + 1} of {targetStudents.length}
                  </div>
                  <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 space-y-6">
                  {/* Student Card Header */}
                  <div className="flex flex-col items-center space-y-3 pt-2">
                      <div className="h-20 w-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white">
                          {student.name.charAt(0)}
                      </div>
                      <div className="text-center">
                          <h2 className="text-2xl font-bold text-black">{student.name}</h2>
                          <p className="text-muted-foreground">{student.school || "No School Info"}</p>
                      </div>
                  </div>

                  {/* Attendance Toggle */}
                  <div className="grid grid-cols-2 gap-3">
                      <button
                          onClick={() => handleAttendance(student.id, 'present')}
                          className={cn(
                              "flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200",
                              isPresent ? "bg-black border-black text-white shadow-md" : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                          )}
                      >
                          <UserCheck className="w-6 h-6 mb-1" />
                          <span className="font-bold text-sm">Present</span>
                      </button>
                      <button
                          onClick={() => handleAttendance(student.id, 'absent')}
                          className={cn(
                              "flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200",
                              isAbsent ? "bg-white border-black text-black shadow-md" : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                          )}
                      >
                          <UserX className="w-6 h-6 mb-1" />
                          <span className="font-bold text-sm">Absent</span>
                      </button>
                  </div>

                  {/* Rating Content */}
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {isPresent && (
                          <Card className="p-6 space-y-6 border-gray-100 shadow-sm">
                              {CATEGORIES.map(cat => (
                                  <div key={cat} className="space-y-2">
                                      <div className="flex justify-between items-center">
                                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t[cat.toLowerCase()] || cat}</label>
                                         <span className="text-lg font-bold text-black">{r[cat] || 0}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                          <StarRatingInput 
                                              value={r[cat] || 0}
                                              onChange={(val) => handleRating(student.id, cat, val)}
                                          />
                                      </div>
                                  </div>
                              ))}
                          </Card>
                      )}

                      {isAbsent && (
                          <Card className="p-6 space-y-4 border-gray-100 shadow-sm">
                               <label className="text-sm font-bold text-black uppercase tracking-wide">Reason for Absence</label>
                               <Select 
                                  value={r.absenceReason || ''} 
                                  onChange={(e) => handleReason(student.id, e.target.value)}
                                  className="h-12 w-full bg-gray-50 border-gray-200 text-lg"
                               >
                                   <option value="">Select Reason...</option>
                                   {LEAVE_REASONS.map(re => <option key={re} value={re}>{re}</option>)}
                               </Select>
                          </Card>
                      )}

                      {!isPresent && !isAbsent && (
                           <div className="text-center py-12 text-gray-400 italic bg-white rounded-xl border border-dashed border-gray-200">
                               Select attendance to proceed with rating.
                           </div>
                      )}
                  </div>
              </div>

              {/* Bottom Navigation */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 items-center justify-between z-30 pb-safe md:justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStudent} 
                    disabled={currentStudentIndex === 0}
                    className="h-14 w-14 rounded-full border-2 border-gray-200 p-0 flex items-center justify-center shrink-0 text-black hover:border-black hover:bg-transparent"
                  >
                      <ChevronLeft className="w-6 h-6" />
                  </Button>

                  <Button 
                    onClick={handleNextStudent}
                    disabled={!isPresent && !isAbsent}
                    className="flex-1 max-w-sm h-14 bg-black text-white hover:bg-gray-800 rounded-full text-lg font-bold shadow-lg disabled:opacity-50"
                  >
                      {currentStudentIndex === targetStudents.length - 1 ? 'Finish & Save' : 'Next Student'}
                      {currentStudentIndex !== targetStudents.length - 1 && <ChevronRight className="ml-2 w-5 h-5" />}
                  </Button>
              </div>
          </div>
      );
  }

  // ------------------------------------------
  // RENDER: STEP 3 - COMPLETED
  // ------------------------------------------
  if (viewStep === 'COMPLETED') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8 animate-in zoom-in duration-300">
              <div className="relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
                  <div className="h-24 w-24 bg-black rounded-full flex items-center justify-center shadow-xl relative z-10">
                      <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </div>
              </div>
              
              <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-black tracking-tight">{t.ratingCompleteTitle}</h2>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    You have successfully rated {targetStudents.length} students for this session.
                  </p>
              </div>
              
              <div className="w-full max-w-xs space-y-3 pt-4">
                  <Button 
                      onClick={() => setViewStep('SELECTION')}
                      className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-xl font-bold shadow-md"
                  >
                      Back to Dashboard
                  </Button>
                  <Button 
                      variant="ghost"
                      onClick={() => setViewStep('SELECTION')}
                      className="w-full h-14 text-muted-foreground hover:text-black hover:bg-transparent"
                  >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rate Another Class
                  </Button>
              </div>
          </div>
      );
  }

  return null;
};