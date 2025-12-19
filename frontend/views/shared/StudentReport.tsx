
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Download, MapPin, Phone, Mail, User as UserIcon, ChevronLeft, ChevronRight, BookOpen, Calendar, Clock } from 'lucide-react';
import { Card, Button, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { generateStudentInsights } from '../../services/geminiService';
import { api } from '../../services/backendApi';
import { AIInsightSection } from '../../components/AIInsightSection';
import { User, Student, ClassGroup, Score, BehaviorRating, Session, AttendanceRecord } from '../../types';

interface StudentReportProps {
  t: any;
  user: User;
  students: Student[];
  classes: ClassGroup[];
  scores: Score[];
  behaviors: BehaviorRating[];
  sessions: Session[];
  attendance: AttendanceRecord[];
}

export const StudentReport: React.FC<StudentReportProps> = ({ t, user, students, classes, scores, behaviors, sessions, attendance }) => {
  // Defensive check: ensure students is an array
  const safeStudents = Array.isArray(students) ? students : [];

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [insightText, setInsightText] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Schedule View State
  const [scheduleDate, setScheduleDate] = useState(new Date());

  // Initialize selection
  useEffect(() => {
    if (!selectedStudentId && safeStudents.length > 0) {
       setSelectedStudentId(safeStudents[0].id);
    }
  }, [safeStudents, selectedStudentId]);

  // Logic to generate and save insights (Copied from Students.tsx)
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
              return `### ${icon} ${i.type}\n\n${i.message}`;
          }).join('\n\n');
          
          setInsightText(text);
          setLastUpdated(now);
          return text;
      } finally {
          setIsAiLoading(false);
      }
  };

  // Fetch or Generate Insights on Student Selection
  useEffect(() => {
    if (selectedStudentId) {
        setScheduleDate(new Date());
        setInsightText(null);
        setLastUpdated(null);
        setIsAiLoading(true);

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
                            return `### ${icon} ${i.type}\n\n${i.message}`;
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

  const handleGenerateInsight = async () => {
    const student = safeStudents.find(s => s.id === selectedStudentId);
    if (!student) return "";
    return performGeneration(student);
  };

  const handleScreenshot = async () => {
      const element = document.getElementById('student-report-content');
      if (!element) return;

      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;

      try {
        element.style.overflow = 'visible';
        element.style.maxHeight = 'none';

        const canvas = await (window as any).html2canvas(element, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          ignoreElements: (el: Element) => el.id === 'student-report-schedule'
        });
        const data = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = data;
        link.download = `Student_Report_${selectedStudent?.name || 'Export'}.png`;
        link.click();
      } catch (err) {
        console.error('Screenshot failed', err);
        alert('Failed to capture screenshot. Please try again.');
      } finally {
        element.style.overflow = originalOverflow;
        element.style.maxHeight = originalMaxHeight;
      }
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

  // --- Data Calculations ---
  const selectedStudent = safeStudents.find(s => s.id === selectedStudentId);

  const attendanceStats = useMemo(() => {
    if (!selectedStudentId || !selectedStudent) return { present: 0, total: 0 };
    const completedSessions = sessions.filter(s => 
        s.status === 'COMPLETED' && 
        (selectedStudent.classIds || []).includes(s.classId) &&
        (!s.targetStudentIds || s.targetStudentIds.includes(selectedStudentId))
    );
    
    const presentCount = completedSessions.reduce((acc, session) => {
        const att = attendance.find(a => a.sessionId === session.id && a.studentId === selectedStudentId);
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

  if (!selectedStudent) return <div className="p-8 text-center text-muted-foreground">{safeStudents.length === 0 ? t.noStudentFound : t.pleaseSelectStudent}</div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Student Selector (For Teachers/HQ or Parents with multiple kids) */}
      <div className="w-full">
         <Select 
            className="w-full bg-white border-gray-200"
            value={selectedStudentId}
            onChange={(e) => { setSelectedStudentId(e.target.value); }}
         >
            {safeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
         </Select>
      </div>

      {/* Main Report Content Container */}
      <div id="student-report-content" className="space-y-6 bg-background p-1 md:p-0">
         
         {/* 1. Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
             <div>
                 <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedStudent.name}</h2>
                 <div className="text-muted-foreground flex items-center gap-2 mt-1">
                     <MapPin className="w-4 h-4" /> {selectedStudent.school || 'No School Info'}
                 </div>
                 <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-2 items-center">
                     <span className="font-semibold hidden md:inline">Classes:</span>
                     {(selectedStudent.classIds || []).map(cid => (
                         <Badge key={cid} variant="outline" className="text-foreground bg-secondary/50">
                             <BookOpen className="w-3 h-3 mr-1" />
                             {classes.find(c => c.id === cid)?.name}
                         </Badge>
                     ))}
                 </div>
             </div>
             <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto justify-between md:justify-start">
                {selectedStudent.atRisk ? 
                    <Badge variant="destructive" className="h-7 px-3">{t.atRisk}</Badge> : 
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 h-7 px-3">{t.good}</Badge>
                }
                <Button size="sm" onClick={handleScreenshot} className="bg-black text-white hover:bg-black/90 h-9">
                     <Download className="w-4 h-4 mr-2" /> Export
                </Button>
             </div>
         </div>

         {/* 2. AI Insight Section */}
         <div>
             <AIInsightSection 
                onGenerate={handleGenerateInsight} 
                defaultText={insightText || undefined}
                title={t.aiAnalysis}
                lastUpdated={lastUpdated || undefined}
                isLoading={isAiLoading}
             />
         </div>

         {/* 3. KPIs */}
         <div className="grid grid-cols-2 gap-4">
             <Card className="p-4 flex flex-col items-center justify-center text-center border shadow-sm">
                 <div className="text-2xl md:text-3xl font-bold mb-1">{attendanceStats.present}/{attendanceStats.total}</div>
                 <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">ATTENDANCE (PRESENT/TOTAL)</div>
             </Card>
             <Card className="p-4 flex flex-col items-center justify-center text-center border shadow-sm">
                 <div className="text-2xl md:text-3xl font-bold mb-1">{avgClassRating}</div>
                 <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">AVERAGE CLASS RATING</div>
             </Card>
         </div>

         {/* 4. Charts Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score History Chart (Replaced Class Rating Trend) */}
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                 <h4 className="text-sm font-semibold mb-4 text-center">{t.scoreProgression} (Max: 5)</h4>
                 {scoreChartData.length > 0 ? (
                    <div className="h-[200px] md:h-[250px] w-full">
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
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold mb-4 text-center">{t.behaviorBreakdown} ({scheduleDate.toLocaleString('default', { month: 'short' })})</h4>
                <div className="h-[200px] md:h-[250px] w-full">
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

         {/* 5. Sessions Schedule */}
         <div id="student-report-schedule" className="space-y-4">
             <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-lg border">
                 <h3 className="font-semibold text-sm">{t.sessionsSchedule}</h3>
                 <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 bg-white">
                         <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <span className="text-sm font-medium w-28 md:w-36 text-center">
                         {scheduleDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                     </span>
                     <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 bg-white">
                         <ChevronRight className="h-4 w-4" />
                     </Button>
                 </div>
             </div>

             {/* Desktop Table View */}
             <div className="hidden md:block border rounded-lg overflow-hidden bg-white shadow-sm">
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
                                ? (attRecord ? (attRecord.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') : 'PRESENT')
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

             {/* Mobile Card List View */}
             <div className="md:hidden space-y-3">
                {sessionsInView.map(session => {
                    const attRecord = attendance.find(a => a.sessionId === session.id && a.studentId === selectedStudentId);
                    const status = session.status === 'COMPLETED'
                        ? (attRecord ? (attRecord.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') : 'PRESENT')
                        : session.status;
                    
                    const sessionBehaviors = behaviors.filter(b => b.sessionId === session.id && b.studentId === selectedStudentId);
                    const avgBehavior = sessionBehaviors.length > 0 
                        ? (sessionBehaviors.reduce((a,b) => a + b.rating, 0) / sessionBehaviors.length).toFixed(1)
                        : '-';

                    const formattedDate = new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
                    const className = classes.find(c => c.id === session.classId)?.name || '-';

                    return (
                        <Card key={session.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold text-sm">{formattedDate}</span>
                                </div>
                                <div>
                                    {status === 'PRESENT' && <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent text-[10px]">Present</Badge>}
                                    {status === 'ABSENT' && <Badge variant="destructive" className="text-[10px]">Absent</Badge>}
                                    {status === 'SCHEDULED' && <Badge variant="outline" className="text-[10px]">Scheduled</Badge>}
                                    {status === 'CANCELLED' && <Badge variant="outline" className="text-muted-foreground text-[10px]">Cancelled</Badge>}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{session.startTime}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[120px]">{className}</span>
                                </div>
                            </div>

                            {session.status === 'COMPLETED' && (
                                <div className="pt-2 border-t flex justify-between items-center mt-1">
                                    <div className="text-xs text-muted-foreground">Rating</div>
                                    <div className="font-bold text-sm">{avgBehavior} / 5</div>
                                </div>
                            )}
                            
                            {status === 'ABSENT' && attRecord?.reason && (
                                <div className="pt-2 border-t flex justify-between items-center mt-1">
                                    <div className="text-xs text-muted-foreground">Reason</div>
                                    <div className="text-xs font-medium text-destructive">{attRecord.reason}</div>
                                </div>
                            )}
                        </Card>
                    );
                })}
                {sessionsInView.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl text-sm">
                        {t.noSessionsFound}
                    </div>
                )}
             </div>
         </div>

         {/* 6. Admin / Emergency Details (Hidden for Parents) */}
         {user.role !== 'PARENT' && (
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
         )}
      </div>
    </div>
  );
};
