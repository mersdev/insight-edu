


import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, CalendarPlus, Eye, Download, ChevronLeft, ChevronRight, Search, ArrowUpDown, MoreHorizontal, MapPin, Sparkles, Edit2 } from 'lucide-react';
import { cn, Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, Dropdown, DropdownItem } from '../../components/ui';
import { generateScheduleSessions } from '../../constants';
import { ClassGroup, Teacher, Student, Session, Location } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomItem, sampleClassNames } from '../../utils/malaysianSampleData';

interface ClassesProps {
  t: any;
  classes: ClassGroup[];
  setClasses: (classes: ClassGroup[]) => void;
  teachers: Teacher[];
  students: Student[];
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  locations: Location[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const classNames = cn;
if (typeof window !== 'undefined' && !(window as any).classNames) {
  (window as any).classNames = classNames;
}

const PRIMARY_GRADE_OPTIONS = Array.from({ length: 6 }, (_, index) => `Standard ${index + 1}`);
const SECONDARY_GRADE_OPTIONS = Array.from({ length: 6 }, (_, index) => `Form ${index + 1}`);
const GRADE_OPTIONS = [...PRIMARY_GRADE_OPTIONS, ...SECONDARY_GRADE_OPTIONS];

const parseTimeToMinutes = (value: string) => {
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
};

const formatMinutesToHHMM = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mins = String(normalized % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const parseDurationString = (value?: string) => {
  if (!value) return NaN;
  const [hoursPart, minutesPart = '0'] = value.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
};

const computeEndTime = (start: string, durationMinutes: number) => {
  const startInMinutes = parseTimeToMinutes(start);
  if (Number.isNaN(startInMinutes) || Number.isNaN(durationMinutes)) return start;
  return formatMinutesToHHMM(startInMinutes + durationMinutes);
};

const computeDurationBetweenTimes = (start: string, end: string) => {
  const startInMinutes = parseTimeToMinutes(start);
  const endInMinutes = parseTimeToMinutes(end);
  if (Number.isNaN(startInMinutes) || Number.isNaN(endInMinutes)) {
    return NaN;
  }
  let diff = endInMinutes - startInMinutes;
  if (diff <= 0) {
    diff += 24 * 60;
  }
  return diff;
};

const formatDurationLabel = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null) return '-';
  if (!minutes) return '0m';
  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const Classes: React.FC<ClassesProps> = ({ t, classes, setClasses, teachers, students, sessions, setSessions, locations }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSpecialSessionOpen, setSpecialSessionOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Debug: Log dialog state changes
  useEffect(() => {
    console.log('isDialogOpen changed:', isDialogOpen);
  }, [isDialogOpen]);
  
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
    days: ['Monday'], 
    startTime: '09:00',
    endTime: '10:00',
    sessionDuration: '01:00',
  });
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

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

  const openClassDialog = (cls?: ClassGroup) => {
    if (cls) {
      setEditingClass(cls);
      const schedule = cls.defaultSchedule;
      const durationMinutes = schedule?.durationMinutes ?? 60;
      const startTime = schedule?.time || '09:00';
      const endTime = schedule?.time
        ? computeEndTime(schedule.time, durationMinutes)
        : '10:00';
      const sessionDuration = `${String(Math.floor(durationMinutes / 60)).padStart(2, '0')}:${String(durationMinutes % 60).padStart(2, '0')}`;
      setNewClass({
        name: cls.name,
        grade: cls.grade,
        teacherId: cls.teacherId,
        locationId: cls.locationId,
        days: schedule?.days && schedule.days.length > 0 ? schedule.days : ['Monday'],
        startTime,
        endTime,
        sessionDuration,
      });
    } else {
      setEditingClass(null);
      setNewClass({ 
          name: '', 
          grade: '', 
          teacherId: teachers[0]?.id || '', 
          locationId: locations[0]?.id || '',
          days: ['Monday'],
          startTime: '09:00',
          endTime: '10:00',
          sessionDuration: '01:00',
      });
    }
    setDialogOpen(true);
  };

  const handleAddClick = () => {
    openClassDialog();
  };

  const closeClassDialog = () => {
    setDialogOpen(false);
    setEditingClass(null);
    setNewClass({ 
        name: '', 
        grade: '', 
        teacherId: teachers[0]?.id || '', 
        locationId: locations[0]?.id || '',
        days: ['Monday'],
        startTime: '09:00',
        endTime: '10:00',
        sessionDuration: '01:00',
    });
  };

  const handleSaveClass = async () => {
    console.log('handleSaveClass called', newClass);
    const durationFromTimes = computeDurationBetweenTimes(newClass.startTime, newClass.endTime);
    const parsedDuration = parseDurationString(newClass.sessionDuration);
    const durationMinutes =
      !Number.isNaN(durationFromTimes) && durationFromTimes > 0
        ? durationFromTimes
        : parsedDuration;
    if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      setErrorDialog(t.durationHelp || 'Please provide a valid session duration in HH:MM (e.g. 01:00).');
      return;
    }

    if (!newClass.name || !newClass.grade || !newClass.teacherId || !newClass.locationId || newClass.days.length === 0) {
      console.log('Validation failed:', {
        name: newClass.name,
        grade: newClass.grade,
        teacherId: newClass.teacherId,
        locationId: newClass.locationId,
        days: newClass.days,
      });
      setErrorDialog(t.fillAllFields || 'Please fill in all required fields (Class Name, Grade, Teacher, Location, and Days).');
      return;
    }

    if (!newClass.startTime || !newClass.endTime) {
      setErrorDialog('Please select both start and end times.');
      return;
    }

    console.log('Validation passed, saving class...');
    const schedule = {
      days: newClass.days,
      time: newClass.startTime,
      durationMinutes,
    };

    try {
      if (editingClass) {
        const updated = await api.updateClass({
          id: editingClass.id,
          name: newClass.name,
          grade: newClass.grade,
          teacherId: newClass.teacherId,
          locationId: newClass.locationId,
          defaultSchedule: schedule
        } as ClassGroup);
        setClasses(classes.map((cls) => (cls.id === updated.id ? updated : cls)));
        console.log('Class updated:', updated);
      } else {
        const classId = `c${Date.now()}`;
        const cls = await api.createClass({
          id: classId,
          name: newClass.name,
          grade: newClass.grade,
          teacherId: newClass.teacherId,
          locationId: newClass.locationId,
          defaultSchedule: schedule
        } as ClassGroup);

        console.log('Class created:', cls);
        setClasses([...classes, cls]);

        const generatedSessions = generateScheduleSessions(classId, schedule);
        console.log('Generated sessions:', generatedSessions.length);

        const createdSessions = await Promise.all(generatedSessions.map(s => api.createSession(s)));
        setSessions([...sessions, ...createdSessions]);
      }
      closeClassDialog();
    } catch (error) {
      console.error('Error creating class:', error);
      setErrorDialog(t.errorCreatingClass || 'Failed to create class. Please try again.');
    }
  };

  const handleAutoFillClass = () => {
    const className = getRandomItem(sampleClassNames);
    const grade = getRandomItem(GRADE_OPTIONS);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const selectedDays = [getRandomItem(days)];
    if (Math.random() > 0.5) {
      const additionalDay = getRandomItem(days.filter(d => !selectedDays.includes(d)));
      if (additionalDay) {
        selectedDays.push(additionalDay);
      }
    }
    const selectedStartTime = getRandomItem(times);
    const durationOptions = ['01:00', '01:30', '02:00'];
    const selectedDuration = getRandomItem(durationOptions);
    const durationMinutes = parseDurationString(selectedDuration);
    const computedEndTime = Number.isNaN(durationMinutes)
      ? selectedStartTime
      : computeEndTime(selectedStartTime, durationMinutes);

    setNewClass({
      ...newClass,
      name: className,
      grade,
      days: selectedDays,
      startTime: selectedStartTime,
      sessionDuration: selectedDuration,
      endTime: computedEndTime,
    });
  };

  const handleStartTimeChange = (value: string) => {
    setNewClass((prev) => {
      const durationMinutes = parseDurationString(prev.sessionDuration);
      const updatedEndTime = Number.isNaN(durationMinutes)
        ? prev.endTime
        : computeEndTime(value, durationMinutes);
      return {
        ...prev,
        startTime: value,
        endTime: updatedEndTime,
      };
    });
  };

  const handleEndTimeChange = (value: string) => {
    setNewClass((prev) => {
      const durationMinutes = computeDurationBetweenTimes(prev.startTime, value);
      const formattedDuration = Number.isNaN(durationMinutes)
        ? prev.sessionDuration
        : formatMinutesToHHMM(durationMinutes);
      return {
        ...prev,
        endTime: value,
        sessionDuration: formattedDuration,
      };
    });
  };

  const handleSessionDurationChange = (value: string) => {
    setNewClass((prev) => {
      const durationMinutes = parseDurationString(value);
      const updatedEndTime = Number.isNaN(durationMinutes)
        ? prev.endTime
        : computeEndTime(prev.startTime, durationMinutes);
      return {
        ...prev,
        sessionDuration: value,
        endTime: updatedEndTime,
      };
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
              <TableHead>{t.assignedLocation}</TableHead>
              <TableHead>{t.weeklyDays}</TableHead>
              <TableHead>{t.time}</TableHead>
              <TableHead>{t.sessionDuration}</TableHead>
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
                  <TableCell>{(cls.defaultSchedule?.days && cls.defaultSchedule.days.length > 0) ? cls.defaultSchedule.days.join(', ') : '-'}</TableCell>
                  <TableCell>{cls.defaultSchedule?.time || '-'}</TableCell>
                  <TableCell>{formatDurationLabel(cls.defaultSchedule?.durationMinutes)}</TableCell>
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
                                <DropdownItem onClick={() => openClassDialog(cls)}>
                                    <div className="flex items-center gap-2">
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        {t.edit}
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
                <TableCell colSpan={8} className="h-24 text-center">{t.noData}</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

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
        onClose={closeClassDialog}
        title={editingClass ? `${t.edit} ${t.classes}` : t.addNewClass}
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
             <Button type="button" onClick={handleSaveClass}>{editingClass ? 'Update' : t.save}</Button>
              <Button type="button" variant="outline" onClick={closeClassDialog}>{t.cancel}</Button>
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
             <Select
                value={newClass.grade}
                onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                required
             >
                <option value="" disabled>{t.gradePlaceholder || 'Select Standard / Form'}</option>
                {GRADE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
             </Select>
             <p className="text-xs text-muted-foreground mt-1">
               {t.gradeDescription || 'Primary (Standard 1-6) or Secondary (Form 1-6) grades.'}
             </p>
           </div>
           <div className="space-y-3">
             <div className="space-y-2">
                 <label className="block text-sm font-medium">
                 {t.weeklyDays}
                 <span className="block text-xs text-muted-foreground font-normal">
                   Select one or multiple days for the recurring schedule.
                 </span>
               </label>
               <div className="flex flex-wrap gap-2">
                 {WEEKDAYS.map((day) => {
                   const isSelected = newClass.days.includes(day);
                   return (
                     <button
                       key={day}
                       type="button"
                       className={cn(
                         'rounded-full border px-3 py-1 text-xs font-semibold transition',
                         isSelected
                           ? 'border-primary bg-primary text-primary-foreground'
                           : 'border-input bg-muted/10 text-muted-foreground'
                       )}
                       onClick={() => {
                         const hasDay = newClass.days.includes(day);
                         setNewClass((prev) => ({
                           ...prev,
                           days: hasDay ? prev.days.filter(d => d !== day) : [...prev.days, day],
                         }));
                       }}
                     >
                       {t[day.toLowerCase()]}
                     </button>
                   );
                 })}
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1.5">
                   {t.startTime || 'Start Time'}
                 </label>
                 <Input
                   type="time"
                   value={newClass.startTime}
                   onChange={(e) => handleStartTimeChange(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1.5">
                   {t.endTime || 'End Time'}
                 </label>
                 <Input
                   type="time"
                   value={newClass.endTime}
                   onChange={(e) => handleEndTimeChange(e.target.value)}
                   required
                 />
               </div>
             </div>
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1.5">
               {t.sessionDuration} (HH:MM)
             </label>
             <Input
               type="text"
               value={newClass.sessionDuration}
               onChange={(e) => handleSessionDurationChange(e.target.value)}
               placeholder="HH:MM"
             />
             <p className="text-xs text-muted-foreground mt-1">
               {t.durationHelp || 'Enter duration as HH:MM (e.g. 01:00) or adjust with the start/end times.'}
             </p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
