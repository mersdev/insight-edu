
import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, AlertCircle, CheckCircle, Eye, Phone, Mail, User as UserIcon, MapPin, Search, ArrowUpDown, Download, School, Check, UserCheck, UserX, MoreHorizontal, BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  LineChart, Line, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Select, Dropdown, DropdownItem } from '../../components/ui';
import { Student, ClassGroup, User, Score, Session, AttendanceRecord, BehaviorRating } from '../../types';
import { api } from '../../services/backendApi';
import { AIInsightSection } from '../../components/AIInsightSection';
import { generateStudentInsights } from '../../services/geminiService';
import { getRandomMalaysianName, getRandomItem, malaysianSchools, malaysianPhoneNumbers, generateEmailFromName } from '../../utils/malaysianSampleData';

interface StudentsProps {
  t: any;
  students: Student[];
  setStudents: (students: Student[]) => void;
  classes: ClassGroup[];
  scores: Score[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  behaviors: BehaviorRating[];
}

export const Students: React.FC<StudentsProps> = ({ t, students, setStudents, classes, scores, sessions, attendance, behaviors }) => {
  // Defensive check: ensure students is an array
  const safeStudents = Array.isArray(students) ? students : [];

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isClassManagerOpen, setClassManagerOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [managingStudentId, setManagingStudentId] = useState<string | null>(null);
  const [tempClassIds, setTempClassIds] = useState<string[]>([]); // Temp state for dialog

  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '', classIds: [], school: '', parentName: '', relationship: 'Father', emergencyContact: '', parentEmail: ''
  });

  const [users, setUsers] = useState<User[]>([]);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Student Profile Schedule View
  const [scheduleDate, setScheduleDate] = useState(new Date());

  useEffect(() => {
     const fetchUsers = async () => {
         const u = await api.fetchUsers();
         setUsers(u);
     };
     fetchUsers();
  }, [safeStudents]);

  // Logic to generate and save insights
  const performGeneration = async (student: Student) => {
      setIsAiLoading(true);
      try {
          const sScores = scores.filter(s => s.studentId === student.id);
          const sBehaviors = behaviors.filter(b => b.studentId === student.id);
          
          const insights = await generateStudentInsights(student, sScores, sBehaviors);
          
          const now = new Date().toISOString();
          await api.saveStudentInsight({
              studentId: student.id,
              insights,
              lastAnalyzed: now
          });
          
          // Format to Markdown
          const text = insights.map(i => {
              const icon = i.type === 'POSITIVE' ? '✅' : i.type === 'NEGATIVE' ? '⚠️' : 'ℹ️';
              return `### ${icon} ${i.type}\n${i.message}`;
          }).join('\n\n');
          
          setInsightText(text);
          setLastUpdated(now);
          return text;
      } finally {
          setIsAiLoading(false);
      }
  };

  // Reset view states when opening profile and check for AI insights
  useEffect(() => {
      if (selectedStudentId) {
          setScheduleDate(new Date());
          setInsightText(null);
          setLastUpdated(null);
          setIsAiLoading(true);

          // Auto-fetch insight from DB
          const initInsights = async () => {
              try {
                  const record = await api.fetchStudentInsight(selectedStudentId);
                  let shouldGenerate = false;

                  if (record) {
                       const now = new Date();
                       const last = new Date(record.lastAnalyzed);
                       // Auto-regenerate if older than 12 hours
                       if (now.getTime() - last.getTime() > 12 * 60 * 60 * 1000) {
                           shouldGenerate = true;
                       } else {
                           // Use existing
                           const text = record.insights.map(i => {
                              const icon = i.type === 'POSITIVE' ? '✅' : i.type === 'NEGATIVE' ? '⚠️' : 'ℹ️';
                              return `### ${icon} ${i.type}\n${i.message}`;
                          }).join('\n\n');
                          setInsightText(text);
                          setLastUpdated(record.lastAnalyzed);
                          setIsAiLoading(false);
                       }
                  } else {
                      shouldGenerate = true;
                  }

                  if (shouldGenerate) {
                      const student = safeStudents.find(s => s.id === selectedStudentId);
                      if (student) {
                          await performGeneration(student);
                      } else {
                          setIsAiLoading(false);
                      }
                  }
              } catch (e) {
                  console.error("Failed to load insights", e);
                  setIsAiLoading(false);
              }
          };
          initInsights();
      }
  }, [selectedStudentId]);

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteStudentConfirm)) {
      await api.deleteStudent(id);
      setStudents(safeStudents.filter(student => student.id !== id));
    }
  };

  const handleAddClick = () => {
    if (classes.length === 0) {
      setErrorDialog(t.classRequired);
      return;
    }
    // Default to first class if available, but keep array format
    setNewStudent({
        name: '',
        classIds: [classes[0].id],
        school: '', parentName: '', relationship: 'Father', emergencyContact: '', parentEmail: ''
    });
    setDialogOpen(true);
  };

  const handleAutoFillStudent = () => {
    const studentName = getRandomMalaysianName();
    const parentName = getRandomMalaysianName();
    const school = getRandomItem(malaysianSchools);
    const phone = getRandomItem(malaysianPhoneNumbers);
    const email = generateEmailFromName(`${parentName.full}.parent`);
    const relationships = ['Father', 'Mother', 'Guardian'];
    const relationship = getRandomItem(relationships);

    setNewStudent({
      ...newStudent,
      name: studentName.full,
      school: school,
      parentName: parentName.full,
      relationship: relationship,
      emergencyContact: phone,
      parentEmail: email,
    });
  };

  const handleSave = async () => {
    // Phone Validation
    const phoneRegex = /^01\d\s?-?\s?\d{3,4}\s\d{4}$/;
    if (newStudent.emergencyContact && !phoneRegex.test(newStudent.emergencyContact)) {
        setErrorDialog('Emergency contact must match format 01X-XXX XXXX or 01X - XXXX XXXX');
        return;
    }

    if (newStudent.name && newStudent.classIds && newStudent.classIds.length > 0) {
      const studentData: any = {
          id: `s${Date.now()}`,
          name: newStudent.name || '',
          parentId: 'p_new',
          classIds: newStudent.classIds, // Array
          attendance: 100,
          atRisk: false
      };

      // Only include optional fields if they have values
      if (newStudent.school && newStudent.school.trim()) {
          studentData.school = newStudent.school;
      }
      if (newStudent.parentName && newStudent.parentName.trim()) {
          studentData.parentName = newStudent.parentName;
      }
      if (newStudent.relationship && newStudent.relationship.trim()) {
          studentData.relationship = newStudent.relationship;
      }
      if (newStudent.emergencyContact && newStudent.emergencyContact.trim()) {
          studentData.emergencyContact = newStudent.emergencyContact;
      }
      if (newStudent.parentEmail && newStudent.parentEmail.trim()) {
          studentData.parentEmail = newStudent.parentEmail;
      }

      const student = await api.createStudent(studentData as Student);

      setStudents([...safeStudents, student]);
      setDialogOpen(false);
    } else {
        setErrorDialog("Please select at least one class.");
    }
  };
  
  const handleSaveClasses = async () => {
      if (!managingStudentId) return;
      const student = safeStudents.find(s => s.id === managingStudentId);
      if (student) {
          const updated = { ...student, classIds: tempClassIds };
          await api.updateStudent(updated);
          setStudents(safeStudents.map(s => s.id === managingStudentId ? updated : s));
          setClassManagerOpen(false);
      }
  };

  const toggleClassSelection = (classId: string) => {
      const current = newStudent.classIds || [];
      if (current.includes(classId)) {
          setNewStudent({ ...newStudent, classIds: current.filter(id => id !== classId) });
      } else {
          setNewStudent({ ...newStudent, classIds: [...current, classId] });
      }
  };

  const handleScreenshot = async () => {
      const element = document.getElementById('student-profile-dialog-content');
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
        link.download = `Student_Profile_${selectedStudent?.name || 'Report'}.png`;
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

  const handlePrevMonth = () => {
      const d = new Date(scheduleDate);
      d.setMonth(d.getMonth() - 1);
      setScheduleDate(d);
  };

  const handleNextMonth = () => {
      const d = new Date(scheduleDate);
      d.setMonth(d.getMonth() + 1);
      setScheduleDate(d);
  };

  const filteredStudents = safeStudents.filter(student =>
      ((student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'ALL' ? true : statusFilter === 'AT_RISK' ? student.atRisk : !student.atRisk)
  ).sort((a, b) => {
      return sortOrder === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
  });

  // --- Student Profile Logic ---
  const selectedStudent = safeStudents.find(s => s.id === selectedStudentId);
  const managingStudent = safeStudents.find(s => s.id === managingStudentId);
  
  // KPI Stats
  const attendanceStats = useMemo(() => {
    if (!selectedStudentId || !selectedStudent) return { present: 0, total: 0 };
    // Count completed sessions where student was present
    const completedSessions = sessions.filter(s => 
        s.status === 'COMPLETED' && 
        (selectedStudent.classIds || []).includes(s.classId) &&
        (!s.targetStudentIds || s.targetStudentIds.includes(selectedStudentId))
    );
    
    const presentCount = completedSessions.reduce((acc, session) => {
        const att = attendance.find(a => a.sessionId === session.id && a.studentId === selectedStudentId);
        // If present OR no record (assume present by default for completed sessions), check record status
        const isPresent = att ? att.status === 'PRESENT' : true; 
        return acc + (isPresent ? 1 : 0);
    }, 0);

    return { present: presentCount, total: completedSessions.length };
  }, [selectedStudentId, selectedStudent, sessions, attendance]);

  const avgClassRating = useMemo(() => {
    if (!selectedStudentId) return 0;
    const sBehaviors = behaviors.filter(b => b.studentId === selectedStudentId);
    if (sBehaviors.length === 0) return 0;
    return (sBehaviors.reduce((a,b) => a + b.rating, 0) / sBehaviors.length).toFixed(1);
  }, [selectedStudentId, behaviors]);

  const sessionsInView = useMemo(() => {
      if (!selectedStudentId || !selectedStudent) return [];
      
      const month = scheduleDate.getMonth();
      const year = scheduleDate.getFullYear();

      const studentSessions = sessions.filter(s => {
          if (!(selectedStudent.classIds || []).includes(s.classId)) return false;
          if (s.targetStudentIds && s.targetStudentIds.length > 0) {
              return s.targetStudentIds.includes(selectedStudentId);
          }
          return true;
      });

      return studentSessions
        .filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === month && d.getFullYear() === year;
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [selectedStudentId, selectedStudent, sessions, scheduleDate]);

  // Score Progression Data (Last 5 Entries)
  const scoreChartData = useMemo(() => {
      if (!selectedStudentId) return [];
      
      return scores
          .filter(s => s.studentId === selectedStudentId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-5)
          .map(s => ({
              date: new Date(s.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
              value: s.value,
              subject: s.subject
          }));
  }, [scores, selectedStudentId]);

  // Radar Chart Data: Avg per Category (For the visible month)
  const radarChartData = useMemo(() => {
    if (!selectedStudentId) return [];
    
    const categories = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];
    const sessionIdsInView = sessionsInView.map(s => s.id);

    return categories.map(cat => {
        const relevantBehaviors = behaviors.filter(b => 
            b.studentId === selectedStudentId && 
            b.category === cat &&
            sessionIdsInView.includes(b.sessionId || '')
        );
        
        const avg = relevantBehaviors.length > 0 
            ? relevantBehaviors.reduce((a, b) => a + b.rating, 0) / relevantBehaviors.length 
            : 0;

        return { subject: cat, A: Number(avg.toFixed(1)), fullMark: 5 };
    });
  }, [sessionsInView, behaviors, selectedStudentId]);

  const handleGenerateInsight = async () => {
    if (!selectedStudent) return "";
    return performGeneration(selectedStudent);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-2">
         <h1 className="text-3xl font-bold tracking-tight">{t.students}</h1>
         <div className="flex gap-2">
            <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" /> {t.add}
            </Button>
         </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-8">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Search by name, school or parent..."
               className="pl-9 w-full h-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="md:col-span-4">
            <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10"
            >
                <option value="ALL">All Status</option>
                <option value="GOOD">{t.good}</option>
                <option value="AT_RISK">{t.atRisk}</option>
            </Select>
          </div>
      </div>

      <Card className="overflow-visible">
        <Table wrapperClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                     {t.name}
                     <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
              </TableHead>
              <TableHead>{t.enrolledClasses}</TableHead>
              <TableHead>{t.parentInfo}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => {
              const enrolledClasses = classes.filter(c => (student.classIds || []).includes(c.id));
              const hasAccount = users.some(u => u.email === student.parentEmail);

              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div>{student.name}</div>
                    {student.school && <div className="text-xs text-muted-foreground">{student.school}</div>}
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1.5">
                          {enrolledClasses.length > 0 ? (
                              enrolledClasses.map(cls => (
                                  <div key={cls.id} className="flex items-center gap-2 text-sm">
                                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{cls.name}</span>
                                  </div>
                              ))
                          ) : (
                              <span className="text-sm text-muted-foreground">{t.unassigned}</span>
                          )}
                      </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                       <span className="font-medium">{student.parentName}</span> 
                       <span className="text-muted-foreground text-xs ml-1">({student.relationship})</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                             <Phone className="w-3 h-3" /> {student.emergencyContact}
                        </div>
                        {hasAccount ? (
                             <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5 gap-1 text-green-600 border-green-200 bg-green-50">
                                 <UserCheck className="w-3 h-3" /> {t.hasAccount}
                             </Badge>
                         ) : (
                             <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5 gap-1 text-muted-foreground border-dashed">
                                 <UserX className="w-3 h-3" /> {t.noAccount}
                             </Badge>
                         )}
                    </div>
                  </TableCell>
                  <TableCell>
                     {student.atRisk ? (
                       <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> {t.atRisk}</Badge>
                     ) : (
                       <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100"><CheckCircle className="w-3 h-3" /> {t.good}</Badge>
                     )}
                  </TableCell>
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
                                <DropdownItem onClick={() => { 
                                    setManagingStudentId(student.id); 
                                    setTempClassIds(student.classIds || []); 
                                    setClassManagerOpen(true); 
                                }}>
                                    <div className="flex items-center gap-2">
                                        <School className="h-4 w-4 text-muted-foreground" />
                                        {t.manageClasses}
                                    </div>
                                </DropdownItem>
                                <DropdownItem onClick={() => setSelectedStudentId(student.id)}>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        View Profile
                                    </div>
                                </DropdownItem>
                            </>
                          }
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredStudents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">{t.noData}</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* ... Dialogs ... */}
      <Dialog
         isOpen={isClassManagerOpen}
         onClose={() => setClassManagerOpen(false)}
         title={t.manageClasses}
      >
          {managingStudent && (
             <div className="space-y-4">
                 <p className="text-sm text-muted-foreground">Select classes for <strong>{managingStudent.name}</strong></p>
                 <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                     {classes.map(cls => {
                         const isEnrolled = tempClassIds.includes(cls.id);
                         return (
                             <div key={cls.id} 
                                  className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 ${isEnrolled ? 'bg-primary/5' : ''}`}
                                  onClick={() => {
                                      // Toggle in temp state only
                                      if (tempClassIds.includes(cls.id)) {
                                          setTempClassIds(tempClassIds.filter(id => id !== cls.id));
                                      } else {
                                          setTempClassIds([...tempClassIds, cls.id]);
                                      }
                                  }}
                             >
                                 <span className="text-sm font-medium">{cls.name}</span>
                                 {isEnrolled && <Check className="w-4 h-4 text-primary" />}
                             </div>
                         );
                     })}
                 </div>
                 <div className="flex justify-end gap-2">
                     <Button variant="outline" onClick={() => setClassManagerOpen(false)}>{t.cancel}</Button>
                     <Button onClick={handleSaveClasses}>Done</Button>
                 </div>
             </div>
          )}
      </Dialog>


      {/* Student Profile Dialog */}
      <Dialog
         isOpen={!!selectedStudentId}
         onClose={() => setSelectedStudentId(null)}
         title="Student Profile"
         className="max-w-4xl"
      >
          {selectedStudent && (
             <div id="student-profile-dialog-content" className="space-y-6 max-h-[80vh] overflow-y-auto p-4 bg-background">
                 <div className="flex justify-between items-start border-b pb-4">
                     <div>
                         <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                         <div className="text-muted-foreground flex items-center gap-2 mt-1">
                             <MapPin className="w-4 h-4" /> {selectedStudent.school || 'No School Info'}
                         </div>
                         <div className="text-sm text-muted-foreground mt-1 flex gap-1 flex-wrap">
                             Classes: 
                             {(selectedStudent.classIds || []).map(cid => (
                                 <span key={cid} className="font-medium text-foreground px-1">{classes.find(c => c.id === cid)?.name},</span>
                             ))}
                         </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        {selectedStudent.atRisk ? 
                            <Badge variant="destructive">{t.atRisk}</Badge> : 
                            <Badge variant="secondary" className="bg-green-100 text-green-700">{t.good}</Badge>
                        }
                        <Button size="sm" onClick={handleScreenshot} className="bg-black text-white hover:bg-black/90">
                             <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                     </div>
                 </div>
                 
                 {/* AI Insight Section */}
                 <div>
                     <AIInsightSection 
                        onGenerate={handleGenerateInsight} 
                        defaultText={insightText || undefined}
                        title={`AI Analysis for ${selectedStudent.name}`}
                        lastUpdated={lastUpdated || undefined}
                        isLoading={isAiLoading}
                     />
                 </div>

                 {/* KPIs */}
                 <div className="grid grid-cols-2 gap-4">
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                         <div className="text-3xl font-bold mb-1">{attendanceStats.present}/{attendanceStats.total}</div>
                         <div className="text-xs text-muted-foreground uppercase">ATTENDANCE (PRESENT/TOTAL)</div>
                     </Card>
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                         <div className="text-3xl font-bold mb-1">{avgClassRating}</div>
                         <div className="text-xs text-muted-foreground uppercase">AVERAGE CLASS RATING</div>
                     </Card>
                 </div>

                 {/* Charts Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Score History Chart (Replaced Class Rating Trend) */}
                    <div className="border rounded-lg p-4 bg-card">
                         <h4 className="text-sm font-semibold mb-4 text-center">{t.scoreProgression} (Max: 5)</h4>
                         {scoreChartData.length > 0 ? (
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={scoreChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                            formatter={(value: any, name: any, props: any) => [`${value}`, props.payload.subject]}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                         ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                {t.noScoreData || 'No score data available'}
                            </div>
                         )}
                    </div>

                    {/* Radar Chart */}
                    <div className="border rounded-lg p-4 bg-card h-fit">
                        <h4 className="text-sm font-semibold mb-4 text-center">{t.behaviorBreakdown} ({scheduleDate.toLocaleString('default', { month: 'short' })})</h4>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar name="Student" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 </div>

                 {/* Sessions Schedule */}
                 <div className="mt-6 border rounded-lg overflow-hidden bg-card h-fit">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                             <h3 className="font-semibold text-sm">{t.sessionsSchedule}</h3>
                             <div className="flex items-center gap-2">
                                 <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                                     <ChevronLeft className="h-4 w-4" />
                                 </Button>
                                 <span className="text-sm font-medium w-36 text-center">
                                     {scheduleDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                 </span>
                                 <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                                     <ChevronRight className="h-4 w-4" />
                                 </Button>
                             </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.date}</TableHead>
                                    <TableHead>{t.time}</TableHead>
                                    <TableHead>{t.className}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>{t.reasonForAbsence || 'Reason'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessionsInView.map(session => {
                                    const attRecord = attendance.find(a => a.sessionId === session.id && a.studentId === selectedStudentId);
                                    const status = session.status === 'COMPLETED'
                                        ? (attRecord ? (attRecord.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') : 'PRESENT') // Default to present if no record but session done
                                        : session.status;
                                    
                                    const sessionBehaviors = behaviors.filter(b => b.sessionId === session.id && b.studentId === selectedStudentId);
                                    const avgBehavior = sessionBehaviors.length > 0 
                                        ? (sessionBehaviors.reduce((a,b) => a + b.rating, 0) / sessionBehaviors.length).toFixed(1)
                                        : '-';

                                    const formattedDate = new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');

                                    return (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium">{formattedDate}</TableCell>
                                            <TableCell>{session.startTime}</TableCell>
                                            <TableCell className="text-muted-foreground">{classes.find(c => c.id === session.classId)?.name || '-'}</TableCell>
                                            <TableCell>
                                                {status === 'PRESENT' && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Present</Badge>}
                                                {status === 'ABSENT' && <Badge variant="destructive">Absent</Badge>}
                                                {status === 'SCHEDULED' && <Badge variant="outline">Scheduled</Badge>}
                                                {status === 'CANCELLED' && <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{avgBehavior}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {attRecord?.status === 'ABSENT' ? (attRecord.reason || 'Unexcused') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {sessionsInView.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            {t.noSessionsFound}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                 </div>

                 {/* Admin / Emergency Details */}
                 <div className="p-4 bg-gray-50/50 rounded-xl border mt-6">
                     <h3 className="text-sm font-bold mb-4">{t.adminDetails}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                         <div className="space-y-1">
                             <label className="text-muted-foreground text-xs uppercase font-semibold">{t.parentNameLabel} ({selectedStudent.relationship?.toUpperCase()})</label>
                             <div className="font-semibold flex items-center gap-2 text-base">
                                <UserIcon className="w-4 h-4" /> {selectedStudent.parentName}
                             </div>
                         </div>
                         <div className="space-y-1">
                             <label className="text-muted-foreground text-xs uppercase font-semibold">{t.emergencyContactLabel}</label>
                             <div className="font-semibold flex items-center gap-2 text-base">
                                <Phone className="w-4 h-4" /> {selectedStudent.emergencyContact}
                             </div>
                         </div>
                         <div className="space-y-1 md:col-span-2">
                             <label className="text-muted-foreground text-xs uppercase font-semibold">{t.parentEmailLabel}</label>
                             <div className="font-semibold flex items-center gap-2 text-base">
                                <Mail className="w-4 h-4" /> {selectedStudent.parentEmail || 'N/A'}
                             </div>
                         </div>
                     </div>
                 </div>

             </div>
          )}
      </Dialog>
      
      {/* ... Add Student Dialog ... */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t.addNewStudent}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleAutoFillStudent}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t.autoFill}
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleSave}>{t.save}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 py-2 max-h-[60vh] overflow-y-auto pr-2">
           {/* Student Info */}
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.name} *</label>
             <Input 
                value={newStudent.name} 
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} 
                placeholder={t.fullNamePlaceholder} 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.school} *</label>
             <Input 
                value={newStudent.school} 
                onChange={(e) => setNewStudent({...newStudent, school: e.target.value})} 
                placeholder={t.schoolPlaceholder} 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.selectClasses} *</label>
             <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                 {classes.map(c => (
                     <div key={c.id} className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded cursor-pointer" onClick={() => toggleClassSelection(c.id)}>
                         <div className={`w-4 h-4 border rounded flex items-center justify-center ${newStudent.classIds?.includes(c.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                             {newStudent.classIds?.includes(c.id) && <Check className="w-3 h-3" />}
                         </div>
                         <span className="text-sm">{c.name}</span>
                     </div>
                 ))}
             </div>
           </div>

           {/* Divider */}
           <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
              <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground uppercase">{t.parentDetails}</span></div>
           </div>

           {/* Parent Info */}
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.parentName} *</label>
             <Input 
                value={newStudent.parentName} 
                onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})} 
                placeholder={t.guardianNamePlaceholder} 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.relationship} *</label>
             <Select value={newStudent.relationship} onChange={(e) => setNewStudent({...newStudent, relationship: e.target.value})}>
                <option value="Father">{t.father}</option>
                <option value="Mother">{t.mother}</option>
                <option value="Guardian">{t.guardian}</option>
                <option value="Other">{t.other}</option>
             </Select>
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.emergencyContact} *</label>
             <Input 
                value={newStudent.emergencyContact} 
                onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})} 
                placeholder="01X-XXX XXXX" 
             />
             <p className="text-xs text-muted-foreground mt-1">Format: 01X-XXX XXXX</p>
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.parentEmail} (Optional)</label>
             <Input 
                type="email"
                value={newStudent.parentEmail} 
                onChange={(e) => setNewStudent({...newStudent, parentEmail: e.target.value})} 
                placeholder={t.emailPlaceholder_teacher} 
             />
             <p className="text-xs text-muted-foreground mt-1">{t.userCreated}</p>
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
