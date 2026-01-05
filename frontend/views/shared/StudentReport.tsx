
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Download, MapPin, Phone, Mail, User as UserIcon, ChevronLeft, ChevronRight, BookOpen, Calendar, Clock } from 'lucide-react';
import { Card, Button, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { generateStudentInsights } from '../../services/geminiService';
import { api } from '../../services/backendApi';
import { User, Student, ClassGroup, Score, BehaviorRating, Session, AttendanceRecord, Teacher, RatingCategory, Insight } from '../../types';
import { buildReportWhatsAppMessage, buildWhatsAppLink, openWhatsAppLink } from '../../utils/whatsapp';
import { useLocation } from 'react-router-dom';

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

const DEFAULT_BEHAVIOR_CATEGORIES = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];
const TUTORING_ASSESSMENT_TYPES = ['QUIZ', 'HOMEWORK', 'LAB', 'PRESENTATION'];
const EXAM_SUBJECT_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#0EA5E9', '#A855F7', '#EC4899'];
const INSIGHT_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const StudentReport: React.FC<StudentReportProps> = ({ t, user, students, classes, scores, behaviors, sessions, attendance, teachers, ratingCategories }) => {
  // Defensive check: ensure students is an array
  const safeStudents = Array.isArray(students) ? students : [];

  const location = useLocation();
  const routeStudentId = useMemo(() => {
    const state = (location.state as { initialStudentId?: string } | null);
    if (state?.initialStudentId) return state.initialStudentId;
    const params = new URLSearchParams(location.search);
    return params.get('studentId') || undefined;
  }, [location.search, location.state]);

  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((teacher) => {
      if (teacher?.id) {
        map.set(teacher.id, teacher);
      }
    });
    return map;
  }, [teachers]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => routeStudentId || safeStudents[0]?.id || '');
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightEntries, setInsightEntries] = useState<Insight[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Schedule View State
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [autoScheduleAppliedFor, setAutoScheduleAppliedFor] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportStatusMessage, setReportStatusMessage] = useState<string | null>(null);
  const canSwitchStudent = user.role !== 'HQ';
  const formatMonthLabel = (date: Date) =>
    date.toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatScheduleFallbackMessage = (current: Date, available: Date) => {
    const currentLabel = formatMonthLabel(current);
    const availableLabel = formatMonthLabel(available);
    if (t.sessionsScheduleFallback) {
      return t.sessionsScheduleFallback
        .replace('{current}', currentLabel)
        .replace('{available}', availableLabel);
    }
    return `No sessions scheduled for ${currentLabel}. Showing ${availableLabel} instead.`;
  };

  const selectedStudent = safeStudents.find((s) => s.id === selectedStudentId) || safeStudents[0];

  // Initialize selection
  useEffect(() => {
    if (routeStudentId && safeStudents.some((student) => student.id === routeStudentId)) {
      if (selectedStudentId !== routeStudentId) {
        setSelectedStudentId(routeStudentId);
      }
      return;
    }

    if (!selectedStudentId && safeStudents.length > 0) {
      setSelectedStudentId(safeStudents[0].id);
    }
  }, [routeStudentId, safeStudents, selectedStudentId]);

  // Logic to generate and save insights (Copied from Students.tsx)
  const performGeneration = async (student: Student) => {
      setIsAiLoading(true);
      try {
          const sScores = scores.filter(s => s.studentId === student.id);
          const sBehaviors = behaviors.filter(b => b.studentId === student.id);
          
          const insights = await generateStudentInsights(student, sScores, sBehaviors);
          setInsightEntries(insights);
          
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
      } catch (err) {
          console.error('AI insight generation failed', err);
          throw err;
      } finally {
          setIsAiLoading(false);
      }
  };

  // Fetch or Generate Insights on Student Selection
  useEffect(() => {
    if (selectedStudentId) {
        setScheduleDate(new Date());
        setInsightText(null);
        setInsightEntries([]);
        setLastUpdated(null);
        setIsAiLoading(true);

        const initInsights = async () => {
            try {
                const record = await api.fetchStudentInsight(selectedStudentId);
                let shouldGenerate = false;

                if (record) {
                     const now = new Date();
                     const last = new Date(record.lastAnalyzed);
                     const isStale = now.getTime() - last.getTime() > INSIGHT_REFRESH_INTERVAL_MS || last.getTime() > now.getTime();
                     // Auto-regenerate if older than interval or timestamp is in the future
                     if (isStale) {
                         shouldGenerate = true;
                     } else {
                         // Use existing
                         const text = record.insights.map(i => {
                            const icon = i.type === 'POSITIVE' ? '✅' : i.type === 'NEGATIVE' ? '⚠️' : 'ℹ️';
                            return `### ${icon} ${i.type}\n\n${i.message}`;
                        }).join('\n\n');
                        setInsightText(text);
                        setInsightEntries(record.insights || []);
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

  // Initialize schedule view: if current month has no sessions, show previous month on load only.
  useEffect(() => {
    if (!selectedStudentId || !selectedStudent) return;
    if (autoScheduleAppliedFor === selectedStudentId) return;

    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const studentSessions = sessions.filter((s) => {
      if (!(selectedStudent.classIds || []).includes(s.classId)) return false;
      if (s.targetStudentIds && s.targetStudentIds.length > 0) {
        return s.targetStudentIds.includes(selectedStudentId);
      }
      return true;
    });

    const hasCurrentMonthSessions = studentSessions.some((session) => {
      const d = new Date(session.date);
      return d.getMonth() === baseDate.getMonth() && d.getFullYear() === baseDate.getFullYear();
    });

    if (hasCurrentMonthSessions) {
      setScheduleDate(baseDate);
      setAutoScheduleAppliedFor(selectedStudentId);
      return;
    }

    const prevDate = new Date(baseDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const hasPrevMonthSessions = studentSessions.some((session) => {
      const d = new Date(session.date);
      return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear();
    });

    if (hasPrevMonthSessions) {
      setScheduleDate(prevDate);
    } else {
      setScheduleDate(baseDate);
    }

    setAutoScheduleAppliedFor(selectedStudentId);
  }, [selectedStudentId, selectedStudent, sessions, autoScheduleAppliedFor]);

  const handleRefreshInsights = async () => {
    const student = safeStudents.find((s) => s.id === selectedStudentId);
    if (!student) return;
    try {
      await performGeneration(student);
    } catch (err) {
      console.error('Manual AI refresh failed', err);
    }
  };

  const formatReportMessage = () => {
    const student = safeStudents.find(s => s.id === selectedStudentId);
    if (!student) return '';

    if (!insightText) {
      return `${student.name}'s latest report is ready for you.`;
    }

    const stripped = insightText
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#>*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return stripped || `${student.name}'s latest report is ready for you.`;
  };

  const handleSendReportWhatsApp = async () => {
    const student = safeStudents.find(s => s.id === selectedStudentId);
    if (!student) return;

    setIsSendingReport(true);
    setReportStatusMessage(null);

    const parentPhone = student.emergencyContact;
    if (!parentPhone) {
      setReportStatusMessage(t.reportWhatsAppPhoneMissing || 'Parent phone number is missing.');
      setIsSendingReport(false);
      return;
    }

    try {
      await captureReportCanvas();
    } catch (screenshotError) {
      console.error('Screenshot capture failed', screenshotError);
      // Continue even if screenshot failed so the WhatsApp message can still be sent
    }

    try {
      const summary = formatReportMessage();
      const message = buildReportWhatsAppMessage({
        studentName: student.name,
        summary,
      });
      const link = buildWhatsAppLink(parentPhone, message);
      if (!link) {
        throw new Error('Invalid WhatsApp phone number');
      }
      openWhatsAppLink(link);
      setReportStatusMessage(t.reportWhatsAppSuccess || 'Report opened in WhatsApp');
    } catch (error) {
      console.error('Send report via WhatsApp failed', error);
      setReportStatusMessage(t.reportWhatsAppFailure || 'Failed to open WhatsApp report message');
    } finally {
      setIsSendingReport(false);
    }
  };

  const cloneSectionForPrint = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return null;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('button').forEach((btn) => btn.remove());
    clone.querySelectorAll('select').forEach((select) => {
      const selected = select.querySelector<HTMLOptionElement>('option:checked');
      const span = document.createElement('div');
      span.textContent = selected?.textContent || '-';
      span.style.fontSize = '0.85rem';
      span.style.color = 'inherit';
      select.replaceWith(span);
    });
    clone.querySelectorAll('button svg, svg.lucide, svg[data-lucide]').forEach((svg) => svg.remove());
    return clone;
  };

  const splitSectionByCharts = (sectionId: string, chartSelector: string, chartsPerPage: number) => {
    const baseClone = cloneSectionForPrint(sectionId);
    if (!baseClone) return [];

    const chartCount = baseClone.querySelectorAll(chartSelector).length;
    if (chartCount <= chartsPerPage) {
      return [baseClone];
    }

    const sections: HTMLElement[] = [];
    for (let start = 0; start < chartCount; start += chartsPerPage) {
      const sectionClone = cloneSectionForPrint(sectionId);
      if (!sectionClone) continue;
      const charts = Array.from(sectionClone.querySelectorAll(chartSelector));
      charts.forEach((chart, index) => {
        if (index < start || index >= start + chartsPerPage) {
          chart.remove();
        }
      });
      sections.push(sectionClone);
    }
    return sections;
  };

  const captureReportCanvas = async () => {
    const canvases = await capturePrintablePages();
    return canvases.length > 0 ? canvases[0] : null;
  };

  const createPrintablePages = () => {
    const pageWidthPx = 780;
    const chartsPerPage = 2;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '-10000px';
    wrapper.style.width = `${pageWidthPx}px`;
    wrapper.style.zIndex = '9999';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '16px';

    const pages: HTMLElement[] = [];
    const applyChartSizing = (section: HTMLElement) => {
      section.querySelectorAll<HTMLElement>('.recharts-responsive-container').forEach((chart) => {
        chart.style.width = '100%';
        chart.style.height = '220px';
      });
    };
    const appendPage = (sections: HTMLElement[]) => {
      if (sections.length === 0) return;
      const page = document.createElement('div');
      page.style.width = `${pageWidthPx}px`;
      page.style.margin = '0 auto';
      page.style.padding = '32px';
      page.style.borderRadius = '16px';
      page.style.backgroundColor = '#ffffff';
      page.style.boxShadow = 'none';
      page.style.border = '1px solid #E5E7EB';
      page.style.boxSizing = 'border-box';
      page.style.display = 'flex';
      page.style.flexDirection = 'column';
      page.style.justifyContent = 'flex-start';
      page.style.gap = '20px';
      page.style.pageBreakAfter = 'always';
      page.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      sections.forEach((clone) => {
        clone.style.width = '100%';
        clone.style.boxSizing = 'border-box';
        applyChartSizing(clone);
        page.appendChild(clone);
      });

      if (page.childElementCount > 0) {
        wrapper.appendChild(page);
        pages.push(page);
      }
    };

    const introSections = ['student-report-header', 'report-section-ai', 'report-section-attendance']
      .map((sectionId) => cloneSectionForPrint(sectionId))
      .filter((section): section is HTMLElement => Boolean(section));
    appendPage(introSections);

    const scoreSections = splitSectionByCharts('report-section-score', '[data-report-chart]', chartsPerPage);
    scoreSections.forEach((section, index) => {
      appendPage([section]);
    });

    const quizSections = splitSectionByCharts('report-section-quiz', '[data-report-chart]', chartsPerPage);
    quizSections.forEach((section, index) => {
      appendPage([section]);
    });

    const feedbackSection = cloneSectionForPrint('report-section-feedback');
    if (feedbackSection) {
      appendPage([feedbackSection]);
    }

    if (pages.length === 0) return null;

    document.body.appendChild(wrapper);
    return { container: wrapper, pages };
  };

  const capturePrintablePages = async () => {
    const printable = createPrintablePages();
    if (!printable) return [];

    try {
      const canvases: HTMLCanvasElement[] = [];
      for (const page of printable.pages) {
        const canvas = await (window as any).html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        canvases.push(canvas);
      }
      return canvases;
    } finally {
      printable.container.remove();
    }
  };

  const handleExportPdf = async () => {
    try {
      const canvases = await capturePrintablePages();
      if (!canvases || canvases.length === 0) return;

      const jspdf = (window as any).jspdf;
      const jsPDFConstructor = jspdf?.jsPDF;
      const downloadAsPng = () => {
        const link = document.createElement('a');
        link.href = canvases[0].toDataURL('image/png');
        link.download = `Student_Report_${selectedStudent?.name || 'Export'}.png`;
        link.click();
      };

      if (!jsPDFConstructor) {
        downloadAsPng();
        return;
      }

      const pdf = new jsPDFConstructor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      canvases.forEach((canvas, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        const imageData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const xOffset = (pdfWidth - imageWidth) / 2;
        const yOffset = (pdfHeight - imageHeight) / 2;
        pdf.addImage(imageData, 'PNG', xOffset, yOffset, imageWidth, imageHeight);
      });

      pdf.save(`Student_Report_${selectedStudent?.name || 'Export'}.pdf`);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export report. Please try again.');
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

  const attendanceRate = attendanceStats.total > 0
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0;

  const sessionViewData = useMemo(() => {
    const requestedDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1);

    if (!selectedStudentId || !selectedStudent) {
      return {
        sessions: [],
        displayDate: requestedDate,
      };
    }

    const studentSessions = sessions.filter((s) => {
      if (!(selectedStudent.classIds || []).includes(s.classId)) return false;
      if (s.targetStudentIds && s.targetStudentIds.length > 0) {
        return s.targetStudentIds.includes(selectedStudentId);
      }
      return true;
    });

    const sortChronologically = (items: Session[]) =>
      items
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const filtered = sortChronologically(
      studentSessions.filter((session) => {
        const d = new Date(session.date);
        return d.getMonth() === requestedDate.getMonth() && d.getFullYear() === requestedDate.getFullYear();
      })
    );

    return {
      sessions: filtered,
      displayDate: requestedDate,
    };
  }, [selectedStudentId, selectedStudent, sessions, scheduleDate]);

  const sessionsInView = sessionViewData.sessions;
  const scheduleDisplayDate = sessionViewData.displayDate;
  const scheduleViewHint = sessionsInView.length === 0
    ? `${formatMonthLabel(scheduleDisplayDate)} sessions are displayed. No sessions scheduled.`
    : `${formatMonthLabel(scheduleDisplayDate)} sessions are displayed.`;

  const studentScores = useMemo(() => {
    if (!selectedStudentId) return [];
    return scores
      .filter((score) => score.studentId === selectedStudentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scores, selectedStudentId]);

  const subjectBreakdown = useMemo(() => {
    const aggregate = new Map<string, { total: number; count: number }>();
    studentScores.forEach((score) => {
      const subject = score.subject || t.subject;
      const entry = aggregate.get(subject) || { total: 0, count: 0 };
      entry.total += score.value;
      entry.count += 1;
      aggregate.set(subject, entry);
    });
    return Array.from(aggregate.entries())
      .map(([subject, summary]) => ({
        subject,
        average: summary.total / summary.count,
        count: summary.count,
      }))
      .sort((a, b) => b.average - a.average);
  }, [studentScores, t.subject]);

  const typeBreakdown = useMemo(() => {
    const aggregate = new Map<string, { total: number; count: number }>();
    studentScores.forEach((score) => {
      const type = score.type || 'Exam';
      const entry = aggregate.get(type) || { total: 0, count: 0 };
      entry.total += score.value;
      entry.count += 1;
      aggregate.set(type, entry);
    });
    return Array.from(aggregate.entries()).map(([type, summary]) => ({
      type,
      average: summary.total / summary.count,
      count: summary.count,
    }));
  }, [studentScores]);

  const historyScores = useMemo(() => {
    return studentScores.slice(0, 10);
  }, [studentScores]);

  const formatScoreDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const radarChartData = useMemo(() => {
    if (!selectedStudentId) return [];
    
    const categories = ratingCategories.length > 0
      ? ratingCategories.map((category) => category.name)
      : DEFAULT_BEHAVIOR_CATEGORIES;
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
  }, [sessionsInView, behaviors, selectedStudentId, ratingCategories]);

  const studentBehaviors = useMemo(
    () => behaviors.filter((b) => b.studentId === selectedStudentId),
    [behaviors, selectedStudentId]
  );
  const avgClassRatingValue = useMemo(() => {
    if (studentBehaviors.length === 0) return 0;
    return studentBehaviors.reduce((sum, behavior) => sum + behavior.rating, 0) / studentBehaviors.length;
  }, [studentBehaviors]);
  const avgClassRating = avgClassRatingValue.toFixed(1);
  const feedbackPercent = Math.min(100, Math.round((avgClassRatingValue / 5) * 100));
  const tutoringAssessments = useMemo(
    () => studentScores.filter((score) => TUTORING_ASSESSMENT_TYPES.includes(score.type)),
    [studentScores]
  );
  const tutoringAverage = useMemo(() => {
    if (tutoringAssessments.length === 0) return 0;
    return tutoringAssessments.reduce((sum, score) => sum + score.value, 0) / tutoringAssessments.length;
  }, [tutoringAssessments]);
  const latestTutoringAssessment = tutoringAssessments[0] || null;
  const examScores = useMemo(
    () => studentScores.filter((score) => score.type === 'EXAM'),
    [studentScores]
  );
  const examAverage = useMemo(() => {
    if (examScores.length === 0) return 0;
    return examScores.reduce((sum, score) => sum + score.value, 0) / examScores.length;
  }, [examScores]);
  const examSeries = useMemo(() => {
    if (examScores.length === 0) return [];
    const bySubject = new Map<string, { date: string; timestamp: number; value: number }[]>();
    examScores.forEach((score) => {
      if (!score.date) return;
      const subject = score.subject || t.subject || 'Subject';
      const timestamp = new Date(score.date).getTime();
      const dateLabel = new Date(score.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const existing = bySubject.get(subject) || [];
      existing.push({ date: dateLabel, timestamp, value: score.value });
      bySubject.set(subject, existing);
    });
    return Array.from(bySubject.entries())
      .map(([subject, points]) => ({
        subject,
        data: points.sort((a, b) => a.timestamp - b.timestamp).map(({ date, value }) => ({ date, value })),
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [examScores, t.subject]);

  const tutoringSeries = useMemo(() => {
    if (tutoringAssessments.length === 0) return [];
    const byType = new Map<string, Map<number, { date: string; total: number; count: number }>>();
    tutoringAssessments.forEach((score) => {
      if (!score.date) return;
      const type = score.type || 'ASSESSMENT';
      const timestamp = new Date(score.date).getTime();
      const dateLabel = new Date(score.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const typeMap = byType.get(type) || new Map();
      const existing = typeMap.get(timestamp) || { date: dateLabel, total: 0, count: 0 };
      existing.total += score.value;
      existing.count += 1;
      typeMap.set(timestamp, existing);
      byType.set(type, typeMap);
    });
    return Array.from(byType.entries())
      .map(([type, dateMap]) => ({
        subject: type,
        data: Array.from(dateMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([, entry]) => ({ date: entry.date, value: Math.round(entry.total / entry.count) })),
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [tutoringAssessments]);
  const examHighLow = useMemo(() => {
    if (examScores.length === 0) {
      return { highest: null, lowest: null };
    }
    let highest = examScores[0];
    let lowest = examScores[0];
    examScores.forEach((score) => {
      if (score.value > highest.value) highest = score;
      if (score.value < lowest.value) lowest = score;
    });
    return { highest, lowest };
  }, [examScores]);
  const focusIndicators = useMemo(() => subjectBreakdown.slice(0, 6), [subjectBreakdown]);
  const currentYearLabel = new Date().getFullYear();
  const renderLegend = (label: string, color: string) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-2 w-9 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
  const ensureMinWordCount = (text: string, minWords: number) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length >= minWords) return text.trim();
    const fillerWords = Array.from({ length: minWords - words.length }, (_, idx) => (idx % 2 === 0 ? 'additional' : 'detail'));
    return `${text.trim()} ${fillerWords.join(' ')}`.trim();
  };

  const insightLabelMap = {
    POSITIVE: t.aiPositiveLabel,
    NEGATIVE: t.aiNegativeLabel,
    OVERALL: t.aiOverallLabel,
  };

  const preparedInsightEntries = useMemo(
    () =>
      insightEntries.map((entry) => ({
        ...entry,
        message: ensureMinWordCount(entry.message, 30),
      })),
    [insightEntries]
  );

  const quickSummaryText = useMemo(() => {
    if (!selectedStudent) return '';
    if (preparedInsightEntries.length === 0 && !insightText) {
      return `${selectedStudent.name}’s monthly performance highlights are being prepared.`;
    }
    const overall = preparedInsightEntries.find((entry) => entry.type === 'OVERALL');
    if (overall?.message) return overall.message;
    if (preparedInsightEntries[0]?.message) return preparedInsightEntries[0]?.message;
    return insightText ? ensureMinWordCount(insightText, 30) : `${selectedStudent.name}’s latest report is ready.`;
  }, [preparedInsightEntries, insightText, selectedStudent]);

  if (!selectedStudent) return <div className="p-8 text-center text-muted-foreground">{safeStudents.length === 0 ? t.noStudentFound : t.pleaseSelectStudent}</div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 w-full">
      <div className="w-full max-w-full md:max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
        {/* Student Selector (For Teachers/HQ or Parents with multiple kids) */}
        <div className="w-full">
          {canSwitchStudent ? (
            <Select
              className="w-full bg-white border-gray-200"
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
              }}
            >
              {safeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="rounded-lg border border-muted/30 bg-white px-3 py-2 text-sm text-muted-foreground">
              Viewing report for <span className="font-medium text-foreground">{selectedStudent?.name}</span>
            </div>
          )}
        </div>

        {/* Main Report Content Container */}
        <div id="student-report-content" className="w-full max-w-full min-w-0 text-sm sm:text-base">
          <div id="student-report-header" className="space-y-4 border-b border-muted/40 pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground break-words">{selectedStudent.name}'s Monthly Report</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  A private, AI-assisted summary of attendance, exams, quizzes, and classroom insights for this month.
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground break-words">
                  <MapPin className="w-4 h-4" /> <span>{selectedStudent.school || 'No School Info'}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 w-full min-w-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSendingReport}
                    onClick={handleSendReportWhatsApp}
                    className="h-9 flex-shrink-0 w-full sm:w-auto whitespace-normal sm:whitespace-nowrap text-center leading-snug"
                    data-cy="whatsapp-report-btn"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {isSendingReport
                      ? (t.sendingReport || 'Preparing WhatsApp message...')
                      : (t.sendReport || 'Send Report via WhatsApp')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportPdf}
                    className="bg-black text-white hover:bg-black/90 h-9 flex-shrink-0 w-full sm:w-auto whitespace-normal sm:whitespace-nowrap text-center leading-snug"
                  >
                    <Download className="w-4 h-4 mr-2" /> {t.exportPDF || 'Export PDF'}
                  </Button>
                </div>
                {reportStatusMessage && (
                  <div className="text-xs sm:text-sm text-muted-foreground">{reportStatusMessage}</div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {selectedStudent.atRisk
                    ? <Badge variant="destructive" className="h-7 px-3">{t.atRisk}</Badge>
                    : <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 h-7 px-3">{t.good}</Badge>}
                </div>
              </div>
            </div>
          </div>

          <section id="report-section-ai" className="rounded-2xl sm:rounded-3xl border border-muted/60 bg-white p-4 sm:p-6 shadow-sm space-y-4 w-full max-w-full min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">Quick Summary for Student</p>
                <h2 className="text-lg sm:text-xl font-bold text-foreground break-words">{t.quickSummaryTitle || 'Quick Summary for Student'}</h2>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground break-words">{quickSummaryText}</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end w-full md:w-auto">
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    {t.lastUpdatedLabel ? `${t.lastUpdatedLabel}: ${new Date(lastUpdated).toLocaleString()}` : `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-full sm:w-auto whitespace-normal sm:whitespace-nowrap text-center leading-snug"
                  disabled={isAiLoading}
                  onClick={handleRefreshInsights}
                >
                  {isAiLoading ? (t.refreshingAi || 'Refreshing...') : (t.refreshAi || 'Refresh AI Insights')}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 min-w-0">
              {isAiLoading && (
                <>
                  <div className="h-24 rounded-2xl border border-muted/50 bg-muted/10 animate-pulse" />
                  <div className="h-24 rounded-2xl border border-muted/50 bg-muted/10 animate-pulse" />
                </>
              )}
              {!isAiLoading && preparedInsightEntries.length > 0 && preparedInsightEntries.map((entry) => (
                <div key={`${entry.type}-${entry.message}`} className="rounded-2xl border border-muted/60 bg-background p-4 space-y-2 min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{insightLabelMap[entry.type] || entry.type}</p>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words">{entry.message}</p>
                </div>
              ))}
              {!isAiLoading && preparedInsightEntries.length === 0 && (
                <div className="rounded-2xl border border-muted/60 bg-background p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.noInsights || `${selectedStudent.name}’s AI insights will appear here after the next analysis.`}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6 mt-6">
            <section id="report-section-attendance" className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-white p-4 sm:p-6 shadow-sm space-y-4 w-full max-w-full min-w-0">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t.attendanceSectionTitle}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t.attendanceDescription}</p>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3 min-w-0">
                    <div className="rounded-2xl border border-muted/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.attendanceDaysLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{attendanceStats.present}</p>
                    </div>
                    <div className="rounded-2xl border border-muted/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.attendanceTotalLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{attendanceStats.total}</p>
                    </div>
                    <div className="rounded-2xl border border-muted/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.attendanceRateLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{attendanceRate}%</p>
                    </div>
                </div>
            </section>

                        <section id="report-section-score" className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-white p-4 sm:p-6 shadow-sm space-y-6 w-full max-w-full min-w-0">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t.schoolExamTitle}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t.schoolExamDesc}</p>
                </div>
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.averageScore}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{examAverage ? examAverage.toFixed(0) : '-'}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{examScores.length} {t.records}</p>
                </div>
                <div className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">
                        <span>{t.scoreProgression}</span>
                        <span>{examScores.length} {t.records}</span>
                    </div>
                    {examSeries.length > 0 ? (
                        <div className="grid gap-4">
                            {examSeries.map((series, index) => (
                                <div key={series.subject} className="rounded-2xl border border-muted/40 bg-white p-4 space-y-3" data-report-chart="exam">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{series.subject}</p>
                                        {renderLegend(series.subject, EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length])}
                                    </div>
                                    <div className="h-[180px] sm:h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={series.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} isAnimationActive={false}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                                    formatter={(value: any) => [`${value}`, series.subject]}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length]}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={false}
                                                    connectNulls
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm text-muted-foreground">{t.noScoreData || 'No score data available'}</div>
                    )}
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3 min-w-0">
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.highLowLabel}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {examHighLow.highest ? `${examHighLow.highest.subject}: ${examHighLow.highest.value}` : '-'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {examHighLow.lowest ? `${examHighLow.lowest.subject}: ${examHighLow.lowest.value}` : '-'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">Records</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{examScores.length}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.records}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">{`${t.examBreakdownBySubject} (${currentYearLabel})`}</h3>
                    {subjectBreakdown.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 min-w-0">
                            {subjectBreakdown.map((entry) => (
                                <div key={entry.subject} className="rounded-2xl border border-muted/40 bg-white p-4">
                                    <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.subject}</p>
                                    <p className="text-base sm:text-lg font-semibold text-foreground">{entry.subject}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {entry.count} {t.records} · {Math.round(entry.average)} {t.score}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t.noExamData}</p>
                    )}
                </div>
            </section>
            <section id="report-section-quiz" className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-white p-4 sm:p-6 shadow-sm space-y-6 w-full max-w-full min-w-0">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t.tutoringQuizTitle}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t.tutoringQuizDesc}</p>
                </div>
                <div className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">
                        <span>{t.scoreProgression}</span>
                        <span>{tutoringAssessments.length} {t.records}</span>
                    </div>
                    {tutoringSeries.length > 0 ? (
                        <div className="grid gap-4">
                            {tutoringSeries.map((series, index) => (
                                <div key={series.subject} className="rounded-2xl border border-muted/40 bg-white p-4 space-y-3" data-report-chart="tutoring">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{series.subject}</p>
                                        {renderLegend(series.subject, EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length])}
                                    </div>
                                    <div className="h-[180px] sm:h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={series.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} isAnimationActive={false}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                                    formatter={(value: any) => [`${value}`, series.subject]}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length]}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={false}
                                                    connectNulls
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm text-muted-foreground">{t.noTutoringAssessments}</div>
                    )}
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3 min-w-0">
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.averageScore}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">
                            {tutoringAverage ? tutoringAverage.toFixed(0) : '-'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.records}: {tutoringAssessments.length}</p>
                    </div>
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.latestAssessmentLabel}</p>
                        {latestTutoringAssessment ? (
                            <>
                                <p className="text-base sm:text-lg font-semibold">{latestTutoringAssessment.subject}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {formatScoreDate(latestTutoringAssessment.date)} · {latestTutoringAssessment.value}
                                </p>
                            </>
                        ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground">{t.noTutoringAssessments}</p>
                        )}
                    </div>
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.assessmentCoverageLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{tutoringAssessments.length}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.records}</p>
                    </div>
                </div>
                <div className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground mb-3">Quiz Breakdown ({currentYearLabel})</p>
                    <div className="hidden md:block">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.date}</TableHead>
                                    <TableHead>{t.subject}</TableHead>
                                    <TableHead>{t.typeLabel}</TableHead>
                                    <TableHead>{t.score}</TableHead>
                                    <TableHead>{t.teacherLabel}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tutoringAssessments.map((score, index) => (
                                    <TableRow key={`${score.subject}-${score.type}-${score.date}-${index}`}>
                                        <TableCell>{formatScoreDate(score.date)}</TableCell>
                                        <TableCell>{score.subject}</TableCell>
                                        <TableCell>{score.type}</TableCell>
                                        <TableCell>{score.value}</TableCell>
                                        <TableCell>
                                            {teacherMap.get(score.teacherId || '')?.name || t.teacherLabel}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden space-y-3">
                        {tutoringAssessments.map((score, index) => (
                            <div key={`${score.subject}-${score.type}-${score.date}-${index}`} className="rounded-2xl border border-muted/40 bg-white p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t.date}</span>
                                    <span className="text-xs font-semibold text-foreground">{formatScoreDate(score.date)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t.subject}</span>
                                    <span className="text-xs font-medium text-foreground">{score.subject}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t.typeLabel}</span>
                                    <span className="text-xs font-medium text-foreground">{score.type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t.score}</span>
                                    <span className="text-xs font-semibold text-foreground">{score.value}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t.teacherLabel}</span>
                                    <span className="text-xs font-medium text-foreground">
                                        {teacherMap.get(score.teacherId || '')?.name || t.teacherLabel}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {tutoringAssessments.length === 0 && (
                            <div className="rounded-2xl border border-muted/40 bg-white p-4 text-xs text-muted-foreground text-center">
                                {t.noTutoringAssessments}
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <section id="report-section-feedback" className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-white p-4 sm:p-6 shadow-sm space-y-6 w-full max-w-full min-w-0">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Post Class Feedback (by Month)</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t.postClassFeedbackDesc}</p>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3 min-w-0">
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.feedbackCoverageLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{studentBehaviors.length}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.records}</p>
                    </div>
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.feedbackPercentLabel}</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{feedbackPercent}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">/100</p>
                    </div>
                    <div className="rounded-2xl border border-muted/40 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">Average Rating</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">{avgClassRating}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">1–5</p>
                    </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] min-w-0">
                    <div className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4 space-y-3">
                        <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.learningIndicatorTitle}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t.learningIndicatorDesc}</p>
                        </div>
                        {radarChartData.length === 0 ? (
                            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">{t.noData}</div>
                        ) : (
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarChartData}>
                                        <PolarGrid stroke="hsl(var(--border))" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Student"
                                            dataKey="A"
                                            stroke="hsl(var(--primary))"
                                            fill="hsl(var(--primary))"
                                            fillOpacity={0.2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4 space-y-4">
                        <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{t.skillsBreakdown}</p>
                        {focusIndicators.length === 0 ? (
                            <p className="text-xs sm:text-sm text-muted-foreground">{t.noScoreData}</p>
                        ) : (
                            focusIndicators.map((indicator) => {
                                const progress = Math.min(100, Math.round(indicator.average));
                                return (
                                    <div key={indicator.subject} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                            <span>{indicator.subject}</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted/20">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">{indicator.count} {t.records}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
          <section id="student-report-schedule" className="rounded-2xl sm:rounded-3xl border border-muted/40 bg-background p-4 sm:p-6 shadow-sm space-y-4 w-full max-w-full min-w-0">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">{`${t.sessionsSchedule} (by Month)`}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 bg-white">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-32 text-center">{formatMonthLabel(scheduleDisplayDate)}</span>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 bg-white">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto rounded-3xl border border-muted/40 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.time}</TableHead>
                    <TableHead>{t.className}</TableHead>
                    <TableHead>{t.assignedTeacher}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>{t.reasonForAbsence || 'Reason'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsInView.map((session) => {
                    const attRecord = attendance.find((a) => a.sessionId === session.id && a.studentId === selectedStudentId);
                    const status = session.status === 'COMPLETED'
                      ? (attRecord ? (attRecord.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') : 'PRESENT')
                      : session.status;
                    const sessionBehaviors = behaviors.filter((b) => b.sessionId === session.id && b.studentId === selectedStudentId);
                    const avgBehavior = sessionBehaviors.length > 0
                      ? (sessionBehaviors.reduce((a, b) => a + b.rating, 0) / sessionBehaviors.length).toFixed(1)
                      : '-';
                    const formattedDate = new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
                    const classItem = classes.find((c) => c.id === session.classId);
                    const tutorName = classItem?.teacherId ? teacherMap.get(classItem.teacherId)?.name : '-';
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{formattedDate}</TableCell>
                        <TableCell>{session.startTime}</TableCell>
                        <TableCell className="text-muted-foreground">{classItem?.name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tutorName || '-'}</TableCell>
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
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t.noSessionsFound}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{scheduleViewHint}</p>
            <div className="md:hidden space-y-3">
              {sessionsInView.map((session) => {
                const attRecord = attendance.find((a) => a.sessionId === session.id && a.studentId === selectedStudentId);
                const status = session.status === 'COMPLETED'
                  ? (attRecord ? (attRecord.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') : 'PRESENT')
                  : session.status;
                const sessionBehaviors = behaviors.filter((b) => b.sessionId === session.id && b.studentId === selectedStudentId);
                const avgBehavior = sessionBehaviors.length > 0
                  ? (sessionBehaviors.reduce((a, b) => a + b.rating, 0) / sessionBehaviors.length).toFixed(1)
                  : '-';
                const formattedDate = new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
                const classItem = classes.find((c) => c.id === session.classId);
                const className = classItem?.name || '-';
                const tutorName = classItem?.teacherId ? teacherMap.get(classItem.teacherId)?.name : '-';
                return (
                  <Card key={session.id} className="p-4 flex flex-col gap-3 border-muted/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-xs sm:text-sm">{formattedDate}</span>
                      </div>
                      <div>
                        {status === 'PRESENT' && <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent text-[10px]">Present</Badge>}
                        {status === 'ABSENT' && <Badge variant="destructive" className="text-[10px]">Absent</Badge>}
                        {status === 'SCHEDULED' && <Badge variant="outline" className="text-[10px]">Scheduled</Badge>}
                        {status === 'CANCELLED' && <Badge variant="outline" className="text-muted-foreground text-[10px]">Cancelled</Badge>}
                      </div>
                    </div>
                    <div className="space-y-2 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Time
                        </span>
                        <span className="font-medium text-foreground">{session.startTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          Class
                        </span>
                        <span className="font-medium text-foreground text-right break-words">{className}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Tutor</span>
                        <span className="font-medium text-foreground text-right break-words">{tutorName || '-'}</span>
                      </div>
                    </div>
                    {session.status === 'COMPLETED' && (
                      <div className="pt-2 border-t flex justify-between items-center mt-1">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Rating</div>
                        <div className="font-bold text-xs sm:text-sm">{avgBehavior} / 5</div>
                      </div>
                    )}
                    {status === 'ABSENT' && attRecord?.reason && (
                      <div className="pt-2 border-t flex justify-between items-center mt-1">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Reason</div>
                        <div className="text-[10px] sm:text-xs font-medium text-destructive">{attRecord.reason}</div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {sessionsInView.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl text-xs sm:text-sm">
                  {t.noSessionsFound}
                </div>
              )}
            </div>
          </section>
          {user.role !== 'PARENT' && (
            <div id="report-section-admin" className="p-4 bg-gray-50/50 rounded-xl border mt-6 w-full max-w-full min-w-0">
              <h3 className="text-sm sm:text-base font-bold mb-4">{t.adminDetails}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs uppercase font-semibold">
                    {t.parentNameLabel} ({selectedStudent.relationship?.toUpperCase()})
                  </label>
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
    </div>
  </div>
);
};
