


import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, CalendarPlus, Eye, FileText, Download, ChevronLeft, ChevronRight, Calendar, Search, ArrowUpDown, MoreHorizontal, MapPin, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, Legend } from 'recharts';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, Dropdown, DropdownItem } from '../../components/ui';
import { generateScheduleSessions } from '../../constants';
import { ClassGroup, Teacher, Student, Session, Score, AttendanceRecord, Location } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomItem, classNames } from '../../utils/malaysianSampleData';

interface ClassesProps {
  t: any;
  classes: ClassGroup[];
  setClasses: (classes: ClassGroup[]) => void;
  teachers: Teacher[];
  students: Student[];
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  scores: Score[];
  attendance: AttendanceRecord[];
  locations: Location[];
}

export const Classes: React.FC<ClassesProps> = ({ t, classes, setClasses, teachers, students, sessions, setSessions, scores, attendance, locations }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSpecialSessionOpen, setSpecialSessionOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Debug: Log dialog state changes
  useEffect(() => {
    console.log('isDialogOpen changed:', isDialogOpen);
  }, [isDialogOpen]);
  
  // Report State
  const [reportClassId, setReportClassId] = useState<string | null>(null);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  
  // Session Pagination State
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Filters
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // New Class State
  const [newClass, setNewClass] = useState({ 
    name: '', 
    grade: '', 
    teacherId: '', 
    locationId: '',
    dayOfWeek: 'Monday', 
    time: '09:00' 
  });

  // Special Session State
  const [specialSession, setSpecialSession] = useState({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    targetStudentIds: [] as string[]
  });

  const handleDelete = async (id: string) => {
    // Check if any student has this class in their classIds
    const enrolledStudents = students.filter(s => (s.classIds || []).includes(id));
    if (enrolledStudents.length > 0) {
      setErrorDialog(`Cannot delete this class. There are currently ${enrolledStudents.length} student(s) enrolled. Please move or delete the students first.`);
      return;
    }

    if (confirm(t.deleteClassConfirm)) {
      await api.deleteClass(id);
      setClasses(classes.filter(c => c.id !== id));
      setSessions(sessions.filter(s => s.classId !== id));
    }
  };

  const handleAddClick = () => {
    setNewClass({ 
        name: '', 
        grade: '', 
        teacherId: teachers[0]?.id || '', 
        locationId: locations[0]?.id || '',
        dayOfWeek: 'Monday', 
        time: '09:00' 
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    console.log('handleSave called', newClass);

    // Validation
    if (!newClass.name || !newClass.grade || !newClass.teacherId || !newClass.locationId) {
      console.log('Validation failed:', {
        name: newClass.name,
        grade: newClass.grade,
        teacherId: newClass.teacherId,
        locationId: newClass.locationId
      });
      setErrorDialog(t.fillAllFields || 'Please fill in all required fields (Class Name, Grade, Teacher, and Location).');
      return;
    }

    console.log('Validation passed, creating class...');

    try {
      const classId = `c${Date.now()}`;
      const cls = await api.createClass({
        id: classId,
        name: newClass.name,
        grade: newClass.grade,
        teacherId: newClass.teacherId,
        locationId: newClass.locationId,
        defaultSchedule: {
          dayOfWeek: newClass.dayOfWeek,
          time: newClass.time
        }
      } as ClassGroup);

      console.log('Class created:', cls);
      setClasses([...classes, cls]);

      const generatedSessions = generateScheduleSessions(classId, newClass.dayOfWeek, newClass.time);
      console.log('Generated sessions:', generatedSessions.length);

      // Create all sessions in parallel instead of sequentially
      const createdSessions = await Promise.all(generatedSessions.map(s => api.createSession(s)));
      setSessions([...sessions, ...createdSessions]);

      console.log('All done, closing dialog');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating class:', error);
      setErrorDialog(t.errorCreatingClass || 'Failed to create class. Please try again.');
    }
  };

  const handleAutoFillClass = () => {
    const className = getRandomItem(classNames);
    const grades = ['9', '10', '11', '12'];
    const grade = getRandomItem(grades);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    setNewClass({
      ...newClass,
      name: className,
      grade: grade,
      dayOfWeek: getRandomItem(days),
      time: getRandomItem(times),
    });
  };

  const openSpecialSessionDialog = (classId: string) => {
    setSpecialSession({
      classId,
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      targetStudentIds: []
    });
    setSpecialSessionOpen(true);
  };

  const handleSaveSpecialSession = async () => {
    if (!specialSession.classId || !specialSession.date || !specialSession.time) return;

    const newSession: Session = {
      id: `ses_spec_${Date.now()}`,
      classId: specialSession.classId,
      date: specialSession.date,
      startTime: specialSession.time,
      type: 'SPECIAL',
      status: 'SCHEDULED',
      targetStudentIds: specialSession.targetStudentIds.length > 0 ? specialSession.targetStudentIds : undefined
    };

    await api.createSession(newSession);
    setSessions([...sessions, newSession]);
    setSpecialSessionOpen(false);
  };

  const captureElement = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalOverflow = element.style.overflow;
    const originalMaxHeight = element.style.maxHeight;

    try {
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';

      const canvas = await (window as any).html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const data = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = data;
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error('Screenshot failed', err);
      alert('Failed to capture screenshot. Please try again.');
    } finally {
      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;
    }
  };
  
  const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Auto-set view date when selecting a class
  useEffect(() => {
    if (selectedClassId) {
        const clsSessions = sessions.filter(s => s.classId === selectedClassId);
        if (clsSessions.length > 0) {
            // Check if current month has sessions
            const now = new Date();
            const hasSessionsThisMonth = clsSessions.some(s => {
                const d = new Date(s.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });

            if (!hasSessionsThisMonth) {
                // Default to the latest session's month
                const dates = clsSessions.map(s => new Date(s.date).getTime());
                const maxDate = new Date(Math.max(...dates));
                setCurrentViewDate(maxDate);
            } else {
                setCurrentViewDate(now);
            }
        }
    }
  }, [selectedClassId, sessions]);

  // Derive unique grades
  const grades = useMemo(() => {
     const unique = new Set(classes.map(c => c.grade).filter(Boolean));
     return Array.from(unique).sort();
  }, [classes]);

  const filteredClasses = classes.filter(cls => 
      (cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.grade.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (teacherFilter === 'ALL' ? true : teacherFilter === 'UNASSIGNED' ? !cls.teacherId : cls.teacherId === teacherFilter) &&
      (gradeFilter === 'ALL' || cls.grade === gradeFilter)
  ).sort((a, b) => {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  // --- Statistics Logic for Selected Class ---
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => (s.classIds || []).includes(selectedClassId || ''));
  const allClassSessions = sessions.filter(s => s.classId === selectedClassId);

  // Filter Sessions by View Month
  const viewMonth = currentViewDate.getMonth();
  const viewYear = currentViewDate.getFullYear();
  
  const classSessionsInView = allClassSessions.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handlePrevMonth = () => {
      const d = new Date(currentViewDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentViewDate(d);
  };

  const handleNextMonth = () => {
      const d = new Date(currentViewDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentViewDate(d);
  };

  const classStats = useMemo(() => {
      if (!selectedClassId) return null;
      
      const totalStudents = classStudents.length;
      
      const avgAttendancePerc = classStudents.length > 0 
        ? classStudents.reduce((acc, s) => acc + s.attendance, 0) / classStudents.length 
        : 0;

      const avgPresent = Math.round((avgAttendancePerc / 100) * totalStudents);

      const studentIds = classStudents.map(s => s.id);
      const relevantScores = scores.filter(s => studentIds.includes(s.studentId));
      const avgScore = relevantScores.length > 0
        ? Math.round(relevantScores.reduce((acc, s) => acc + s.value, 0) / relevantScores.length)
        : 0;

      // Absence Data from Real Attendance Records
      // Get all session IDs for this class
      const classSessionIds = allClassSessions.map(s => s.id);
      // Filter attendance records
      const classAttendance = attendance.filter(a => classSessionIds.includes(a.sessionId) && a.status === 'ABSENT' && a.reason);
      
      const reasonsCount: Record<string, number> = {
          [t.sickLeave || 'Sick Leave']: 0,
          [t.personalLeave || 'Personal Leave']: 0,
          [t.schoolEvent || 'School Event']: 0,
          [t.unexcused || 'Unexcused']: 0
      };

      classAttendance.forEach(a => {
          const r = a.reason || 'Unexcused';
          // Normalize key
          const key = Object.keys(reasonsCount).find(k => k.toLowerCase() === r.toLowerCase()) || r;
          reasonsCount[key] = (reasonsCount[key] || 0) + 1;
      });

      
      const absenceData = Object.entries(reasonsCount).map(([name, value]) => ({ name, value }));

      return { avgPresent, totalStudents, avgScore, absenceData };
  }, [selectedClassId, classStudents, t, viewMonth, viewYear, scores, attendance, allClassSessions]);

  // Report Data Calculation
  const reportData = useMemo(() => {
    if (!reportClassId) return null;

    const rClass = classes.find(c => c.id === reportClassId);
    const rStudents = students.filter(s => (s.classIds || []).includes(reportClassId));
    
    // Sessions in Year
    const rSessions = sessions.filter(s => 
        s.classId === reportClassId && 
        new Date(s.date).getFullYear() === reportYear
    );

    // Aggregate by Month
    const monthlyData = Array.from({length: 12}, (_, i) => {
        const date = new Date(reportYear, i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        const monthSessions = rSessions.filter(s => new Date(s.date).getMonth() === i);
        const sessionCount = monthSessions.length;
        
        // Stats
        let avgAttendance = 0;
        let avgScore = 0;

        if (sessionCount > 0) {
             const baseAtt = rStudents.length > 0 
                ? rStudents.reduce((a,b)=>a+b.attendance,0)/rStudents.length 
                : 0;
             const variation = (Math.sin(i * 1.5) * 8); 
             avgAttendance = Math.round(Math.min(100, Math.max(0, baseAtt + variation)));

             avgScore = Math.round(72 + (Math.cos(i) * 5) + (Math.random() * 5)); 
        }

        return {
            month: monthName,
            sessions: sessionCount,
            attendance: avgAttendance,
            score: avgScore,
            status: sessionCount === 0 ? '-' : (avgAttendance < 80 || avgScore < 60 ? 'Review Needed' : 'Good')
        };
    });

    const activeMonths = monthlyData.filter(m => m.sessions > 0);
    const yearlyTotalSessions = rSessions.length;
    const yearlyAvgAttendance = activeMonths.length > 0
        ? Math.round(activeMonths.reduce((a,b) => a + b.attendance, 0) / activeMonths.length)
        : 0;
    const yearlyAvgScore = activeMonths.length > 0
        ? Math.round(activeMonths.reduce((a,b) => a + b.score, 0) / activeMonths.length)
        : 0;

    return {
        className: rClass?.name,
        teacher: teachers.find(t => t.id === rClass?.teacherId)?.name,
        monthlyData,
        yearlyTotalSessions,
        yearlyAvgAttendance,
        yearlyAvgScore
    };
  }, [reportClassId, reportYear, sessions, students, classes, teachers]);

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-2">
         <h1 className="text-3xl font-bold tracking-tight">{t.classes}</h1>
         <div className="flex gap-2">
             <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" /> {t.add}
             </Button>
         </div>
      </div>
      
      {/* Search Bar & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Search by class name or grade..."
               className="pl-9 w-full h-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="md:col-span-4">
            <Select 
                value={teacherFilter} 
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full h-10"
            >
                <option value="ALL">All Teachers</option>
                <option value="UNASSIGNED">{t.unassigned}</option>
                {teachers.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select 
                value={gradeFilter} 
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full h-10"
            >
                <option value="ALL">All Grades</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
      </div>

      <Card className="overflow-visible">
        <Table wrapperClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                     {t.className}
                     <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
              </TableHead>
              <TableHead>{t.grade}</TableHead>
              <TableHead>{t.assignedTeacher}</TableHead>
              <TableHead>{t.locations}</TableHead>
              <TableHead>{t.dayOfWeek}</TableHead>
              <TableHead>{t.time}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.map((cls) => {
              const teacherName = teachers.find(t => t.id === cls.teacherId)?.name || t.unassigned;
              const locationName = locations.find(l => l.id === cls.locationId)?.name || '-';
              return (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.grade}</TableCell>
                  <TableCell>{teacherName}</TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {locationName}
                      </div>
                  </TableCell>
                  <TableCell>{cls.defaultSchedule?.dayOfWeek || '-'}</TableCell>
                  <TableCell>{cls.defaultSchedule?.time || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                        <Dropdown 
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                               <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                          menu={
                            <>
                                <DropdownItem onClick={() => { setReportClassId(cls.id); setReportYear(new Date().getFullYear()); }}>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Yearly Report
                                    </div>
                                </DropdownItem>
                                <DropdownItem onClick={() => setSelectedClassId(cls.id)}>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        View Details
                                    </div>
                                </DropdownItem>
                                <DropdownItem onClick={() => openSpecialSessionDialog(cls.id)}>
                                    <div className="flex items-center gap-2">
                                        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                                        {t.addSpecialSession}
                                    </div>
                                </DropdownItem>
                            </>
                          }
                        />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredClasses.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">{t.noData}</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Yearly Report Dialog */}
      <Dialog
        isOpen={!!reportClassId}
        onClose={() => setReportClassId(null)}
        title={`Yearly Report: ${classes.find(c => c.id === reportClassId)?.name || ''}`}
        className="max-w-3xl"
      >
        <div id="class-report-dialog-content" className="space-y-6 max-h-[80vh] overflow-y-auto p-2 bg-background">
             <div className="flex justify-between items-center gap-4 border-b pb-4">
                 <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <Select 
                        value={reportYear} 
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className="w-32"
                    >
                        {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => captureElement('class-report-dialog-content', `Report_${reportYear}_${reportData?.className}.png`)}>
                     <Download className="w-4 h-4 mr-2" /> Export
                 </Button>
             </div>
             
             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{reportData?.yearlyTotalSessions}</div>
                    <div className="text-xs text-muted-foreground uppercase">Total Sessions</div>
                 </Card>
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{reportData?.yearlyAvgAttendance}%</div>
                    <div className="text-xs text-muted-foreground uppercase">Avg Attendance</div>
                 </Card>
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{reportData?.yearlyAvgScore}</div>
                    <div className="text-xs text-muted-foreground uppercase">Avg Score</div>
                 </Card>
             </div>
             
             {/* Chart */}
             <div className="border rounded-lg p-4 shadow-sm bg-card w-full">
                 <h3 className="text-sm font-semibold mb-4">Performance Trends</h3>
                 <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={reportData?.monthlyData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                             <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                             <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                             <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                             <RechartsTooltip />
                             <Legend />
                             <Line yAxisId="left" type="monotone" name="Attendance (%)" dataKey="attendance" stroke="#16a34a" strokeWidth={2} dot={false} />
                             <Line yAxisId="right" type="monotone" name="Avg Score" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
             </div>

             {/* Table */}
             <div>
                 <h3 className="text-sm font-semibold mb-2">Monthly Breakdown</h3>
                 <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Month</TableHead>
                                <TableHead className="text-center">Sessions</TableHead>
                                <TableHead className="text-center">Attendance</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData?.monthlyData.map((m, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{m.month}</TableCell>
                                    <TableCell className="text-center">{m.sessions > 0 ? m.sessions : '-'}</TableCell>
                                    <TableCell className="text-center">{m.sessions > 0 ? `${m.attendance}%` : '-'}</TableCell>
                                    <TableCell className="text-center">{m.sessions > 0 ? m.score : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={
                                            m.status === 'Review Needed' ? 'text-destructive font-medium text-xs' : 
                                            m.status === 'Good' ? 'text-green-600 font-medium text-xs' : 'text-muted-foreground text-xs'
                                        }>
                                            {m.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
             </div>
        </div>
      </Dialog>

      {/* Class Details Dialog (Existing) */}
      <Dialog
        isOpen={!!selectedClassId}
        onClose={() => setSelectedClassId(null)}
        title={selectedClass?.name || 'Class Details'}
        className="max-w-3xl"
      >
          <div id="class-details-dialog-content" className="space-y-6 max-h-[80vh] overflow-y-auto p-2 bg-background">
             {/* ... Header ... */}
             <div className="flex justify-between items-center gap-2 mb-4">
                 <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                         <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <span className="text-sm font-medium w-36 text-center">
                         {currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                     </span>
                     <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                         <ChevronRight className="h-4 w-4" />
                     </Button>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => captureElement('class-details-dialog-content', `Class_${selectedClass?.name}.png`)} title="Export as Image">
                     <Download className="w-4 h-4 mr-2" /> Export
                 </Button>
             </div>
             
             {/* ... Stats ... */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{classStudents.length}</div>
                    <div className="text-xs text-muted-foreground uppercase">{t.totalStudents}</div>
                 </Card>
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{classStats?.avgPresent}/{classStats?.totalStudents}</div>
                    <div className="text-xs text-muted-foreground uppercase">{t.avgAttendance}</div>
                 </Card>
                 <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{classStats?.avgScore}</div>
                    <div className="text-xs text-muted-foreground uppercase">{t.avgPerformance}</div>
                 </Card>
             </div>

             {/* ... Charts ... */}
             <div className="grid grid-cols-1 gap-6">
                <div className="border rounded-lg p-4 shadow-sm bg-card w-full">
                   <h3 className="text-sm font-semibold mb-2 w-full text-left">Absence by Reason</h3>
                   <div className="h-[200px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classStats?.absenceData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                           <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                           <RechartsTooltip cursor={{fill: 'hsl(var(--muted)/0.2)'}} />
                           <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="border rounded-lg p-4 shadow-sm bg-card w-full">
                   <h3 className="text-sm font-semibold mb-2">Student Performance</h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                         <thead>
                            <tr className="border-b text-left text-muted-foreground">
                               <th className="py-2">Student</th>
                               <th className="py-2 text-right">Att.</th>
                               <th className="py-2 text-right">Score</th>
                            </tr>
                         </thead>
                         <tbody>
                            {classStudents.map(s => {
                                const sScores = scores.filter(sc => sc.studentId === s.id);
                                const sAvg = sScores.length > 0 ? Math.round(sScores.reduce((a,b)=>a+b.value,0)/sScores.length) : '-';
                                return (
                                   <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                      <td className="py-2 font-medium">{s.name}</td>
                                      <td className="py-2 text-right">{s.attendance}%</td>
                                      <td className="py-2 text-right">{sAvg}</td>
                                   </tr>
                                );
                            })}
                            {classStudents.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No students</td></tr>}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
             
             {/* ... Sessions ... */}
             <div>
                 <h3 className="text-sm font-semibold mb-2">Sessions Schedule</h3>
                 <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>{t.date}</TableHead>
                                <TableHead>{t.time}</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classSessionsInView.map(session => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{formatDate(session.date)}</TableCell>
                                    <TableCell>{session.startTime}</TableCell>
                                    <TableCell>
                                        <Badge variant={session.type === 'SPECIAL' ? 'secondary' : 'outline'}>
                                            {session.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={
                                            session.status === 'CANCELLED' ? 'text-destructive font-medium' : 
                                            session.status === 'COMPLETED' ? 'text-green-600 font-medium' : 'text-muted-foreground'
                                        }>
                                            {t[session.status.toLowerCase()] || session.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {classSessionsInView.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                        No sessions for this month.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
             </div>
          </div>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t.addNewClass}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleAutoFillClass}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t.autoFill}
            </Button>
           <div className="flex gap-2">
             <Button type="button" onClick={handleSave}>{t.save}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-2">
           <div>
             <label className="block text-sm font-medium mb-1.5">
               {t.className} <span className="text-destructive">*</span>
             </label>
             <Input
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                placeholder={t.classNamePlaceholder}
                required
             />
           </div>
           <div>
             <label className="block text-sm font-medium mb-1.5">
               {t.grade} <span className="text-destructive">*</span>
             </label>
             <Input
                value={newClass.grade}
                onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                placeholder={t.gradePlaceholder}
                required
             />
           </div>
           <div>
             <label className="block text-sm font-medium mb-1.5">
               {t.assignedTeacher} <span className="text-destructive">*</span>
             </label>
             <Select
                value={newClass.teacherId}
                onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                required
                disabled={teachers.length === 0}
              >
                {teachers.length === 0 ? (
                  <option value="">{t.teacherRequired}</option>
                ) : (
                  teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                )}
              </Select>
              {teachers.length === 0 && (
                <p className="text-sm text-destructive mt-2 bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  {t.teacherRequired}
                </p>
              )}
           </div>
           <div>
             <label className="block text-sm font-medium mb-1.5">
               {t.assignedLocation} <span className="text-destructive">*</span>
             </label>
             <Select
                value={newClass.locationId}
                onChange={(e) => setNewClass({...newClass, locationId: e.target.value})}
                required
                disabled={locations.length === 0}
              >
                {locations.length === 0 ? (
                  <option value="">{t.locationRequired}</option>
                ) : (
                  locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                )}
              </Select>
              {locations.length === 0 && (
                <p className="text-sm text-destructive mt-2 bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  {t.locationRequired}
                </p>
              )}
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium mb-1.5">{t.dayOfWeek}</label>
               <Select value={newClass.dayOfWeek} onChange={(e) => setNewClass({...newClass, dayOfWeek: e.target.value})}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                    <option key={d} value={d}>{t[d.toLowerCase()]}</option>
                  ))}
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-1.5">{t.time}</label>
               <Input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({...newClass, time: e.target.value})}
               />
             </div>
           </div>
        </div>
      </Dialog>

      {/* Add Special Session Dialog */}
      <Dialog
        isOpen={isSpecialSessionOpen}
        onClose={() => setSpecialSessionOpen(false)}
        title={t.addSpecialSession}
        footer={
          <>
            <Button variant="outline" onClick={() => setSpecialSessionOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSaveSpecialSession}>{t.save}</Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
           <div>
             <label className="block text-sm font-medium mb-1.5">{t.className}</label>
             <Input disabled value={classes.find(c => c.id === specialSession.classId)?.name || ''} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium mb-1.5">{t.sessionDate}</label>
               <Input type="date" value={specialSession.date} onChange={(e) => setSpecialSession({...specialSession, date: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1.5">{t.sessionTime}</label>
               <Input type="time" value={specialSession.time} onChange={(e) => setSpecialSession({...specialSession, time: e.target.value})} />
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium mb-1.5">{t.sessionStudent}</label>
             
             <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/10">
                 {students.filter(s => (s.classIds || []).includes(specialSession.classId)).map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id={`student-${student.id}`}
                            checked={specialSession.targetStudentIds.includes(student.id)}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSpecialSession(prev => ({
                                    ...prev,
                                    targetStudentIds: checked 
                                        ? [...prev.targetStudentIds, student.id]
                                        : prev.targetStudentIds.filter(id => id !== student.id)
                                }));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor={`student-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                            {student.name}
                        </label>
                    </div>
                 ))}
                 {students.filter(s => (s.classIds || []).includes(specialSession.classId)).length === 0 && (
                     <div className="text-sm text-muted-foreground text-center py-2">{t.noStudentsInClass}</div>
                 )}
             </div>
             <p className="text-xs text-muted-foreground mt-1.5">Leave empty to include all students.</p>
           </div>
        </div>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        isOpen={!!errorDialog}
        onClose={() => setErrorDialog(null)}
        title={t.error}
        footer={<Button onClick={() => setErrorDialog(null)}>OK</Button>}
      >
        <p className="text-muted-foreground">{errorDialog}</p>
      </Dialog>
    </div>
  );
};
