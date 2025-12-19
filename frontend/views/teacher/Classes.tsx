import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, MoreHorizontal, CalendarClock, XCircle, Star, UserCheck } from 'lucide-react';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, Button, Dropdown, DropdownItem, Dialog, Input, cn } from '../../components/ui';
import { ClassGroup, Session, Student, BehaviorRating } from '../../types';
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
}

// Helper: Star Rating Component with Black Stars
const StarRatingInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange(star); }}
                    className="focus:outline-none transition-transform active:scale-95 p-1 hover:scale-110"
                >
                    <Star 
                        className={cn(
                            "w-6 h-6 transition-all", 
                            star <= value ? "fill-black text-black" : "text-gray-200 fill-transparent"
                        )} 
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
};

export const TeacherClasses: React.FC<TeacherClassesProps> = ({
  t, classes, selectedClassId, onSelectClass, sessions, setSessions, students, behaviors, setBehaviors
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Reschedule State
  const [isRescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  // Performance Rating State
  const [isPerformanceOpen, setPerformanceOpen] = useState(false);
  const [performanceSession, setPerformanceSession] = useState<Session | null>(null);
  const [tempBehaviors, setTempBehaviors] = useState<Record<string, Record<string, number>>>({}); // studentId -> { category -> rating }

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

  // --- Handlers ---

  const handleOpenReschedule = (session: Session) => {
      setSelectedSession(session);
      setRescheduleData({ date: session.date, time: session.startTime });
      setRescheduleOpen(true);
  };

  const handleOpenPerformance = (session: Session) => {
      setPerformanceSession(session);
      
      const relevantBehaviors = behaviors.filter(b => b.sessionId === session.id);
      const loaded: Record<string, Record<string, number>> = {};
      
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
               // Default to 5 if not found
               loaded[student.id][cat] = found ? found.rating : 5;
          });
      });

      setTempBehaviors(loaded);
      setPerformanceOpen(true);
  };

  const handleCancelSession = async (session: Session) => {
      if (window.confirm("Are you sure you want to cancel this session?")) {
          await api.updateSessionStatus(session.id, 'CANCELLED');
          const updated = sessions.map(s => s.id === session.id ? { ...s, status: 'CANCELLED' as const } : s);
          setSessions(updated);
      }
  };

  const confirmReschedule = async () => {
      if (!selectedSession || !rescheduleData.date || !rescheduleData.time) return;
      
      // 1. Cancel old session
      await api.updateSessionStatus(selectedSession.id, 'CANCELLED');
      
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
      
      const newBehaviors: BehaviorRating[] = [];
      const timestamp = new Date().toISOString();

      Object.entries(tempBehaviors).forEach(([studentId, ratings]) => {
          Object.entries(ratings).forEach(([category, rating]) => {
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
      setBehaviors([...cleanedBehaviors, ...newBehaviors]);
      setPerformanceOpen(false);

      // Persist to DB via API (Parallelized for speed)
      await Promise.all(newBehaviors.map(b => api.recordBehavior(b)));
  };

  const categories = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];

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
                        onClick={() => handleOpenPerformance(session)}
                        className="w-full text-xs h-10 bg-black text-white hover:bg-black/90 shadow-sm"
                    >
                        Student Performance
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        disabled={session.status !== 'SCHEDULED'}
                        onClick={() => handleOpenReschedule(session)}
                        className="w-full text-xs h-10"
                    >
                        Reschedule / Cancel
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
                    <Card key={student.id} className="p-4 border shadow-sm">
                        <div className="flex items-center gap-3 mb-4 border-b pb-3">
                            <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                                {student.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{student.name}</h3>
                                <p className="text-xs text-muted-foreground">Rate performance (1-5)</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {categories.map(cat => (
                                <div key={cat} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground w-1/3">{cat}</label>
                                    <StarRatingInput 
                                        value={tempBehaviors[student.id]?.[cat] || 0}
                                        onChange={(val) => updateRating(student.id, cat, val)}
                                    />
                                </div>
                            ))}
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