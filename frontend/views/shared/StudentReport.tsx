
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Download, MapPin, Phone, Mail, User as UserIcon, ChevronLeft, ChevronRight, BookOpen, Calendar, Clock, Star, Target, Award, Zap, CheckCircle2, BarChart3, MoreHorizontal, History, TrendingUp, TrendingDown, GraduationCap, Sparkles } from 'lucide-react';
import { Card, Button, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { generateStudentInsights } from '../../services/aiService';
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
  const classMap = useMemo(() => {
    const map = new Map<string, ClassGroup>();
    classes.forEach((item) => {
      if (item?.id) {
        map.set(item.id, item);
      }
    });
    return map;
  }, [classes]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => routeStudentId || safeStudents[0]?.id || '');
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightEntries, setInsightEntries] = useState<Insight[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [editedStrengths, setEditedStrengths] = useState('');
  const [editedNeeds, setEditedNeeds] = useState('');
  const [isInsightSaving, setIsInsightSaving] = useState(false);

  // Schedule View State
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [autoScheduleAppliedFor, setAutoScheduleAppliedFor] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportStatusMessage, setReportStatusMessage] = useState<string | null>(null);
  const [scheduleTeacherFilter, setScheduleTeacherFilter] = useState<string>('ALL');
  const [scheduleSubjectFilter, setScheduleSubjectFilter] = useState<string>('ALL');
  const canSwitchStudent = user.role !== 'HQ';
  const formatMonthLabel = (date: Date) =>
    date.toLocaleString('default', { month: 'long', year: 'numeric' });
  const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const reportMonthStart = useMemo(
    () => new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1),
    [scheduleDate]
  );
  const reportMonthKey = useMemo(() => toMonthKey(reportMonthStart), [reportMonthStart]);
  const isSameMonth = (date: Date, compare: Date) =>
    date.getFullYear() === compare.getFullYear() && date.getMonth() === compare.getMonth();

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

  const formatInsightsToMarkdown = (insights: Insight[]) =>
    insights.map(i => {
      const icon = i.type === 'POSITIVE' ? '✅' : i.type === 'NEGATIVE' ? '⚠️' : 'ℹ️';
      return `### ${icon} ${i.type}\n\n${i.message}`;
    }).join('\n\n');

  const parsePoints = (text: string) => {
    if (!text) return [] as string[];
    const normalized = text.replace(/[•·]/g, '\n').replace(/\r/g, '\n');
    const byLine = normalized.split('\n').map(item => item.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
    if (byLine.length > 1) return byLine;
    const bySentence = text.split(/[.!?]\s+/).map(item => item.trim()).filter(Boolean);
    return bySentence.length > 1 ? bySentence : byLine;
  };

  const extractPointsByType = (entries: Insight[], type: Insight['type']) =>
    entries.filter(entry => entry.type === type).flatMap(entry => parsePoints(entry.message));

  const buildInsightEntriesFromEdits = (summary: string, strengths: string, needs: string): Insight[] => {
    const cleanLines = (block: string) =>
      block
        .split('\n')
        .map(line => line.trim().replace(/^[-*•]\s*/, ''))
        .filter(Boolean);

    const insights: Insight[] = [];
    const summaryText = summary.trim();
    if (summaryText) {
      insights.push({ type: 'OVERALL', message: summaryText });
    }
    cleanLines(strengths).forEach(message => insights.push({ type: 'POSITIVE', message }));
    cleanLines(needs).forEach(message => insights.push({ type: 'NEGATIVE', message }));
    return insights;
  };

  const hydrateEditBuffers = (entries: Insight[], summaryFallback: string) => {
    const summaryEntry = entries.find(entry => entry.type === 'OVERALL');
    const strengthsList = extractPointsByType(entries, 'POSITIVE');
    const needsList = extractPointsByType(entries, 'NEGATIVE');
    setEditedSummary(summaryEntry?.message || summaryFallback);
    setEditedStrengths(strengthsList.join('\n'));
    setEditedNeeds(needsList.join('\n'));
  };

  const canEditInsights = user.role !== 'PARENT';

  const isBehaviorInReportMonth = (behavior: BehaviorRating) => {
    if (behavior.date) {
      return isSameMonth(new Date(behavior.date), reportMonthStart);
    }
    if (behavior.sessionId) {
      const session = sessions.find((s) => s.id === behavior.sessionId);
      return session ? isSameMonth(new Date(session.date), reportMonthStart) : false;
    }
    return false;
  };

  // Logic to generate and save insights (Copied from Students.tsx)
  const performGeneration = async (student: Student) => {
    setIsAiLoading(true);
    try {
      const sScores = scores.filter(
        (s) =>
          s.studentId === student.id &&
          s.date &&
          isSameMonth(new Date(s.date), reportMonthStart)
      );
      const sBehaviors = behaviors.filter(
        (b) => b.studentId === student.id && isBehaviorInReportMonth(b)
      );

      const insights = await generateStudentInsights(student, sScores, sBehaviors);
      setInsightEntries(insights);

      const now = new Date().toISOString();
      await api.saveStudentInsight({
        studentId: student.id,
        insights,
        lastAnalyzed: now,
        reportMonthKey
      });

      const text = formatInsightsToMarkdown(insights);

      setInsightText(text);
      setLastUpdated(now);
      hydrateEditBuffers(insights, text);
      return text;
    } catch (err) {
      console.error('AI insight generation failed', err);
      throw err;
    } finally {
      setIsAiLoading(false);
    }
  };

  // Fetch or Generate Insights on Student Selection / Month Change
  useEffect(() => {
    if (!selectedStudentId) return;
    const hasStudent = safeStudents.some((s) => s.id === selectedStudentId);
    if (!hasStudent) return;

    setInsightText(null);
    setInsightEntries([]);
    setLastUpdated(null);
    setIsEditingInsights(false);
    setIsAiLoading(true);

    const initInsights = async () => {
      try {
        const record = await api.fetchStudentInsight(selectedStudentId, reportMonthKey);

        if (record) {
          const text = formatInsightsToMarkdown(record.insights || []);
          setInsightText(text);
          setInsightEntries(record.insights || []);
          setLastUpdated(record.lastAnalyzed);
          hydrateEditBuffers(record.insights || [], text);
          setIsAiLoading(false);
          return;
        }

        const student = safeStudents.find(s => s.id === selectedStudentId);
        if (student) {
          await performGeneration(student);
        } else {
          setIsAiLoading(false);
        }
      } catch (e) {
        console.error("Failed to load insights", e);
        setIsAiLoading(false);
      }
    };
    initInsights();
  }, [selectedStudentId, safeStudents, reportMonthKey]);

  const handleStartEditingInsights = () => {
    hydrateEditBuffers(insightEntries, insightText || '');
    setIsEditingInsights(true);
  };

  const handleCancelEditingInsights = () => {
    hydrateEditBuffers(insightEntries, insightText || '');
    setIsEditingInsights(false);
  };

  const handleSaveEditedInsights = async () => {
    if (!selectedStudentId) return;
    setIsInsightSaving(true);
    try {
      const updatedInsights = buildInsightEntriesFromEdits(editedSummary, editedStrengths, editedNeeds);
      const now = new Date().toISOString();
      await api.saveStudentInsight({
        studentId: selectedStudentId,
        insights: updatedInsights,
        lastAnalyzed: now,
        reportMonthKey,
      });
      const text = formatInsightsToMarkdown(updatedInsights);
      setInsightEntries(updatedInsights);
      setInsightText(text);
      setLastUpdated(now);
      setIsEditingInsights(false);
    } catch (err) {
      console.error('Failed to save insights edits', err);
    } finally {
      setIsInsightSaving(false);
    }
  };

  // Initialize report month: pick the latest available month with data on load only.
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

    const studentScores = scores.filter((score) => score.studentId === selectedStudentId && score.date);
    const monthsWithData: Date[] = [];
    const addMonth = (value?: string) => {
      if (!value) return;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return;
      const monthDate = new Date(d.getFullYear(), d.getMonth(), 1);
      if (!monthsWithData.some((existing) => isSameMonth(existing, monthDate))) {
        monthsWithData.push(monthDate);
      }
    };

    studentSessions.forEach((session) => addMonth(session.date));
    studentScores.forEach((score) => addMonth(score.date));

    const hasCurrentMonth = monthsWithData.some((month) => isSameMonth(month, baseDate));
    if (hasCurrentMonth) {
      setScheduleDate(baseDate);
      setAutoScheduleAppliedFor(selectedStudentId);
      return;
    }

    if (monthsWithData.length > 0) {
      const latestMonth = monthsWithData.sort((a, b) => b.getTime() - a.getTime())[0];
      setScheduleDate(latestMonth);
    } else {
      setScheduleDate(baseDate);
    }

    setAutoScheduleAppliedFor(selectedStudentId);
  }, [selectedStudentId, selectedStudent, sessions, scores, autoScheduleAppliedFor]);

  const handleRefreshInsights = async () => {
    const student = safeStudents.find((s) => s.id === selectedStudentId);
    if (!student) return;
    try {
      await performGeneration(student);
    } catch (err) {
      console.error('Manual AI refresh failed', err);
    }
  };

  const stripMarkdown = (text: string) =>
    text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#>*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const formatReportMessage = () => {
    const student = safeStudents.find(s => s.id === selectedStudentId);
    if (!student) return '';

    if (!insightText) {
      return `${student.name}'s latest report is ready for you.`;
    }

    const stripped = stripMarkdown(insightText);

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

    // Page 1: Header + Quick Summary + Attendance
    const introSections = ['student-report-header', 'report-section-ai', 'report-section-attendance']
      .map((sectionId) => cloneSectionForPrint(sectionId))
      .filter((section): section is HTMLElement => Boolean(section));
    appendPage(introSections);

    // Page 2+: School Exam Scores (one section per page)
    const scoreSections = splitSectionByCharts('report-section-score', '[data-report-chart]', chartsPerPage);
    scoreSections.forEach((section, index) => {
      appendPage([section]);
    });

    // Page 3+: Centre Quiz / Assessment Scores (one section per page)
    const quizSections = splitSectionByCharts('report-section-quiz', '[data-report-chart]', chartsPerPage);
    quizSections.forEach((section, index) => {
      appendPage([section]);
    });

    // Final Page(s): Post Class Feedback (by Month) — split if needed
    const feedbackSections = splitSectionByCharts('report-section-feedback', '[data-report-chart]', chartsPerPage);
    if (feedbackSections.length === 0) {
      const singleFeedback = cloneSectionForPrint('report-section-feedback');
      if (singleFeedback) appendPage([singleFeedback]);
    } else {
      feedbackSections.forEach((section) => appendPage([section]));
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
          width: page.clientWidth,
          windowWidth: page.clientWidth,
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
      const pageImages = canvases.map((canvas) => canvas.toDataURL('image/png'));
      const downloadAsPng = () => {
        const link = document.createElement('a');
        link.href = pageImages[0];
        link.download = `Student_Report_${selectedStudent?.name || 'Export'}.png`;
        link.click();
      };

      if (!jsPDFConstructor) {
        downloadAsPng();
        return;
      }

      const pdf = new jsPDFConstructor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      pageImages.forEach((imageData, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvas = canvases[index];
        const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const xOffset = (pdfWidth - imageWidth) / 2;
        const yOffset = 0; // start at top to avoid vertical centering
        pdf.addImage(imageData, 'PNG', xOffset, yOffset, imageWidth, imageHeight);
      });

      pdf.save(`Student_Report_${selectedStudent?.name || 'Export'}.pdf`);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export report. Please try again.');
    }
  };

  const handlePrevMonth = () => {
    const d = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1);
    d.setMonth(d.getMonth() - 1);
    setScheduleDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1);
    d.setMonth(d.getMonth() + 1);
    setScheduleDate(d);
  };

  // --- Data Calculations ---
  const attendanceStats = useMemo(() => {
    if (!selectedStudentId || !selectedStudent) return { present: 0, total: 0 };

    const sessionsInMonth = sessions.filter((s) =>
      (selectedStudent.classIds || []).includes(s.classId) &&
      (!s.targetStudentIds || s.targetStudentIds.includes(selectedStudentId)) &&
      isSameMonth(new Date(s.date), reportMonthStart)
    );

    const sessionIds = new Set(sessionsInMonth.map((s) => s.id));
    const attendanceInMonth = attendance.filter(
      (a) => a.studentId === selectedStudentId && sessionIds.has(a.sessionId)
    );

    if (attendanceInMonth.length > 0) {
      const present = attendanceInMonth.filter((a) => a.status === 'PRESENT').length;
      return { present, total: attendanceInMonth.length };
    }

    const completedSessions = sessionsInMonth.filter((s) => s.status === 'COMPLETED');
    const presentCount = completedSessions.reduce((acc, session) => {
      const att = attendance.find((a) => a.sessionId === session.id && a.studentId === selectedStudentId);
      const isPresent = att ? att.status === 'PRESENT' : true;
      return acc + (isPresent ? 1 : 0);
    }, 0);

    return { present: presentCount, total: completedSessions.length };
  }, [selectedStudentId, selectedStudent, sessions, attendance, reportMonthStart]);

  const attendanceRate = attendanceStats.total > 0
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0;
  const attendanceInsight = useMemo(() => {
    if (attendanceStats.total === 0) return 'No completed sessions to summarise yet.';
    if (attendanceRate >= 95) return 'Excellent attendance reflects strong learning discipline and consistent class participation.';
    if (attendanceRate >= 85) return 'Solid attendance—keep encouraging this steady routine.';
    return 'Attendance needs attention; small improvements will help learning stick.';
  }, [attendanceRate, attendanceStats]);

  const sessionViewData = useMemo(() => {
    const requestedDate = reportMonthStart;

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

  const sortedSessionsInView = useMemo(() => {
    return sessionsInView
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessionsInView]);

  const scheduleFilterOptions = useMemo(() => {
    const teacherNames = new Set<string>();
    const subjectNames = new Set<string>();
    sortedSessionsInView.forEach((session) => {
      const classItem = classMap.get(session.classId);
      const teacher = classItem?.teacherId ? teacherMap.get(classItem.teacherId) : null;
      teacherNames.add(teacher?.name || 'Assigned');
      subjectNames.add(classItem?.name || 'General');
    });
    return {
      teachers: Array.from(teacherNames).sort((a, b) => a.localeCompare(b)),
      subjects: Array.from(subjectNames).sort((a, b) => a.localeCompare(b)),
    };
  }, [sortedSessionsInView, classMap, teacherMap]);

  const filteredScheduleSessionsInView = useMemo(() => {
    return sortedSessionsInView.filter((session) => {
      const classItem = classMap.get(session.classId);
      const teacher = classItem?.teacherId ? teacherMap.get(classItem.teacherId) : null;
      const teacherName = teacher?.name || 'Assigned';
      const subjectName = classItem?.name || 'General';
      const teacherMatch = scheduleTeacherFilter === 'ALL' || teacherName === scheduleTeacherFilter;
      const subjectMatch = scheduleSubjectFilter === 'ALL' || subjectName === scheduleSubjectFilter;
      return teacherMatch && subjectMatch;
    });
  }, [sortedSessionsInView, classMap, teacherMap, scheduleTeacherFilter, scheduleSubjectFilter]);

  const ATTENDANCE_PAGE_SIZE = 6;
  const SCHEDULE_PAGE_SIZE = 10;
  const [attendancePage, setAttendancePage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);

  useEffect(() => {
    setAttendancePage(1);
    setSchedulePage(1);
  }, [selectedStudentId, reportMonthStart, sessionsInView.length]);

  useEffect(() => {
    if (scheduleTeacherFilter !== 'ALL' && !scheduleFilterOptions.teachers.includes(scheduleTeacherFilter)) {
      setScheduleTeacherFilter('ALL');
    }
    if (scheduleSubjectFilter !== 'ALL' && !scheduleFilterOptions.subjects.includes(scheduleSubjectFilter)) {
      setScheduleSubjectFilter('ALL');
    }
  }, [scheduleFilterOptions, scheduleTeacherFilter, scheduleSubjectFilter]);

  useEffect(() => {
    setSchedulePage(1);
  }, [scheduleTeacherFilter, scheduleSubjectFilter]);

  const attendancePageCount = Math.max(1, Math.ceil(sortedSessionsInView.length / ATTENDANCE_PAGE_SIZE));
  const schedulePageCount = Math.max(1, Math.ceil(filteredScheduleSessionsInView.length / SCHEDULE_PAGE_SIZE));

  const attendanceSessions = sortedSessionsInView.slice(
    (attendancePage - 1) * ATTENDANCE_PAGE_SIZE,
    attendancePage * ATTENDANCE_PAGE_SIZE
  );
  const scheduleSessions = filteredScheduleSessionsInView.slice(
    (schedulePage - 1) * SCHEDULE_PAGE_SIZE,
    schedulePage * SCHEDULE_PAGE_SIZE
  );

  const studentScores = useMemo(() => {
    if (!selectedStudentId) return [];
    return scores
      .filter((score) => score.studentId === selectedStudentId && score.date && isSameMonth(new Date(score.date), reportMonthStart))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scores, selectedStudentId, reportMonthStart]);

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

  useEffect(() => {
    if (subjectBreakdown.length === 0) {
      setSelectedSubject(null);
      return;
    }
    if (!selectedSubject || !subjectBreakdown.some((entry) => entry.subject === selectedSubject)) {
      setSelectedSubject(subjectBreakdown[0].subject);
    }
  }, [subjectBreakdown, selectedSubject]);

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
  const subjectHistory = useMemo(() => {
    if (!selectedSubject) return [];
    return studentScores
      .filter((score) => (score.subject || t.subject) === selectedSubject)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [studentScores, selectedSubject, t.subject]);

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
    () => behaviors.filter((b) => b.studentId === selectedStudentId && sessionsInView.some((s) => s.id === b.sessionId)),
    [behaviors, selectedStudentId, sessionsInView]
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
  const examTrend = useMemo(() => {
    if (examScores.length < 2) return { direction: 'flat', delta: 0 };
    const sorted = [...examScores].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const latest = sorted[sorted.length - 1]?.value || 0;
    const previous = sorted[sorted.length - 2]?.value || 0;
    const delta = latest - previous;
    const direction = delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat';
    return { direction, delta };
  }, [examScores]);
  const tutoringTrend = useMemo(() => {
    if (tutoringAssessments.length < 2) return { direction: 'flat', delta: 0 };
    const sorted = [...tutoringAssessments].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const latest = sorted[sorted.length - 1]?.value || 0;
    const previous = sorted[sorted.length - 2]?.value || 0;
    const delta = latest - previous;
    const direction = delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat';
    return { direction, delta };
  }, [tutoringAssessments]);
  const formatTrendLabel = (trend: { direction: string; delta: number }) => {
    if (trend.direction === 'up') return `Improving (+${Math.round(trend.delta)} pts)`;
    if (trend.direction === 'down') return `Slight dip (${Math.round(trend.delta)} pts)`;
    return 'Consistent';
  };
  const examRemarks = useMemo(() => {
    return studentScores
      .filter((score) => score.type === 'EXAM' && score.remark && score.remark.trim())
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5)
      .map((score) => ({ ...score, formattedDate: formatScoreDate(score.date) }));
  }, [studentScores]);
  const tutoringRemarks = useMemo(() => {
    return studentScores
      .filter((score) => TUTORING_ASSESSMENT_TYPES.includes(score.type) && score.remark && score.remark.trim())
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5)
      .map((score) => ({ ...score, formattedDate: formatScoreDate(score.date) }));
  }, [studentScores]);
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
  const reportMonthOptions = useMemo(() => {
    if (!selectedStudentId) return [] as { key: string; date: Date }[];
    const monthMap = new Map<string, Date>();
    const addMonth = (value?: string) => {
      if (!value) return;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = toMonthKey(monthDate);
      if (!monthMap.has(key)) {
        monthMap.set(key, monthDate);
      }
    };

    sessions.forEach((session) => {
      if (!(selectedStudent.classIds || []).includes(session.classId)) return;
      if (session.targetStudentIds && session.targetStudentIds.length > 0 && !session.targetStudentIds.includes(selectedStudentId)) return;
      addMonth(session.date);
    });
    scores.forEach((score) => {
      if (score.studentId !== selectedStudentId) return;
      addMonth(score.date);
    });

    if (monthMap.size === 0) {
      const base = new Date();
      for (let i = 0; i < 6; i += 1) {
        const date = new Date(base.getFullYear(), base.getMonth() - i, 1);
        monthMap.set(toMonthKey(date), date);
      }
    }

    if (!monthMap.has(reportMonthKey)) {
      monthMap.set(reportMonthKey, reportMonthStart);
    }

    return Array.from(monthMap.entries())
      .map(([key, date]) => ({ key, date }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedStudentId, sessions, scores, selectedStudent, reportMonthKey, reportMonthStart]);
  const handleReportMonthChange = (value: string) => {
    const [year, month] = value.split('-').map((part) => Number(part));
    if (!year || !month) return;
    setScheduleDate(new Date(year, month - 1, 1));
  };
  const renderLegend = (label: string, color: string) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-2 w-9 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
  const insightLabelMap = {
    POSITIVE: t.aiPositiveLabel,
    NEGATIVE: t.aiNegativeLabel,
    OVERALL: t.aiOverallLabel,
  };

  const preparedInsightEntries = useMemo(
    () =>
      insightEntries.map((entry) => ({
        ...entry,
        message: entry.message,
      })),
    [insightEntries]
  );

  const strengthPoints = useMemo(
    () => extractPointsByType(preparedInsightEntries, 'POSITIVE'),
    [preparedInsightEntries]
  );
  const needsPoints = useMemo(
    () => extractPointsByType(preparedInsightEntries, 'NEGATIVE'),
    [preparedInsightEntries]
  );
  const overallSummary = useMemo(() => {
    const overallEntry = preparedInsightEntries.find(entry => entry.type === 'OVERALL');
    if (overallEntry?.message) return overallEntry.message;
    if (preparedInsightEntries[0]?.message) return preparedInsightEntries[0].message;
    return '';
  }, [preparedInsightEntries]);

  const quickSummaryText = useMemo(() => {
    if (!selectedStudent) return '';
    if (preparedInsightEntries.length === 0 && !insightText) {
      return `${selectedStudent.name}’s monthly performance highlights are being prepared.`;
    }
    if (overallSummary) return overallSummary;
    return insightText ? stripMarkdown(insightText) : `${selectedStudent.name}’s latest report is ready.`;
  }, [preparedInsightEntries, insightText, selectedStudent, overallSummary]);
  const chineseSummary = useMemo(() => {
    if (!selectedStudent) return '';
    const attendanceLine = attendanceRate ? `出勤率 ${attendanceRate}%` : '出勤数据待补充';
    const performanceLine = examAverage > 0 ? `考试平均分约 ${Math.round(examAverage)} 分` : '尚未有考试分数记录';
    const participationLine = attendanceRate >= 85 ? '课堂参与保持稳定，学习状态安心。' : '课堂参与需要多一点陪伴和提醒。';
    return `${selectedStudent.name} 本月${attendanceLine}，${performanceLine}，${participationLine}`;
  }, [selectedStudent, attendanceRate, examAverage]);

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
          {/* Header Section */}
          <div id="student-report-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Grade 6</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{selectedStudent.school || 'Springfield Academy'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Born: Jan 15, 2013</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <div className="w-full sm:w-56">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1 block">
                  Report Month
                </label>
                <Select
                  className="w-full bg-white border-gray-200"
                  value={reportMonthKey}
                  onChange={(e) => handleReportMonthChange(e.target.value)}
                  data-cy="report-month-select"
                >
                  {reportMonthOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {formatMonthLabel(option.date)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSendingReport}
                  onClick={handleSendReportWhatsApp}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  data-cy="whatsapp-report-btn"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {isSendingReport ? (t.sendingReport || 'Preparing...') : (t.sendReport || 'WhatsApp')}
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-none" onClick={handleExportPdf}>
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Attendance Rate Card */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-sm font-semibold text-emerald-700">Attendance Rate</p>
                    <p className="text-xs text-emerald-600 font-medium whitespace-nowrap">Excellent attendance! 🎉</p>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">{attendanceRate}%</div>
                </div>
              </div>
            </div>

            {/* School Exam Average Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award className="w-16 h-16 text-blue-600" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-sm font-semibold text-blue-700">School Exam Average</p>
                    <p className="text-xs text-blue-600 font-medium whitespace-nowrap">Strong performance 📈</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{examAverage ? Math.round(examAverage) : '-'}</div>
                </div>
              </div>
            </div>

            {/* Centre Assessment Avg Card */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-16 h-16 text-purple-600" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-sm font-semibold text-purple-700">Centre Assessment Avg</p>
                    <p className="text-xs text-purple-600 font-medium whitespace-nowrap">Great improvement! ✨</p>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">{tutoringAverage ? Math.round(tutoringAverage) : '-'}</div>
                </div>
              </div>
            </div>

            {/* Engagement Rating Card */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star className="w-16 h-16 text-amber-600" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <Star className="w-6 h-6" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-sm font-semibold text-amber-700">Engagement Rating</p>
                    <p className="text-xs text-amber-600 font-medium whitespace-nowrap">Highly engaged! 🌟</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-600">{avgClassRating}</div>
                    <div className="text-[10px] text-amber-500 font-medium">out of 5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Learning Summary Section */}
          <section id="report-section-ai" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Monthly Learning Summary</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEditInsights && !isEditingInsights && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto whitespace-nowrap"
                    onClick={handleStartEditingInsights}
                    data-cy="edit-insight-btn"
                  >
                    Edit Summary
                  </Button>
                )}
                {canEditInsights && isEditingInsights && (
                  <>
                    <Button
                      size="sm"
                      className="w-full sm:w-auto whitespace-nowrap"
                      onClick={handleSaveEditedInsights}
                      disabled={isInsightSaving}
                    >
                      {isInsightSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto whitespace-nowrap"
                      onClick={handleCancelEditingInsights}
                      disabled={isInsightSaving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {canEditInsights && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto whitespace-nowrap"
                    onClick={handleRefreshInsights}
                    disabled={isAiLoading || isEditingInsights}
                  >
                    {isAiLoading ? (t.refreshingAi || 'Refreshing...') : (t.refreshAi || 'Refresh Summary')}
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-6 text-gray-700 leading-relaxed text-lg border border-indigo-50">
              {isEditingInsights ? (
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Write the monthly summary..."
                />
              ) : (
                quickSummaryText
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths & Achievements */}
              <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-50 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3>Strengths & Achievements</h3>
                </div>
                {isEditingInsights ? (
                  <textarea
                    value={editedStrengths}
                    onChange={(e) => setEditedStrengths(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-emerald-100 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="One strength per line..."
                  />
                ) : (
                  <ul className="space-y-3">
                    {strengthPoints.length > 0 ? (
                      strengthPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-emerald-800 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-emerald-800 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>Strong mathematical reasoning and problem-solving</span>
                        </li>
                        <li className="flex items-start gap-3 text-emerald-800 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>Active participation in class discussions</span>
                        </li>
                        <li className="flex items-start gap-3 text-emerald-800 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>Excellent homework completion rate</span>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </div>

              {/* Growth Focus */}
              <div className="bg-amber-50/30 rounded-2xl p-6 border border-amber-50 space-y-4">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3>Growth Focus</h3>
                </div>
                {isEditingInsights ? (
                  <textarea
                    value={editedNeeds}
                    onChange={(e) => setEditedNeeds(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-amber-100 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="One improvement point per line..."
                  />
                ) : (
                  <ul className="space-y-3">
                    {needsPoints.length > 0 ? (
                      needsPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-amber-800 text-sm">
                          <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-amber-800 text-sm">
                          <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>Continue building reading comprehension skills</span>
                        </li>
                        <li className="flex items-start gap-3 text-amber-800 text-sm">
                          <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>Practice more essay writing for English</span>
                        </li>
                        <li className="flex items-start gap-3 text-amber-800 text-sm">
                          <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>Review historical dates and timelines</span>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-6 mt-6">
            <section id="report-section-attendance" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Attendance Overview</h2>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-50">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Present</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-emerald-700">{attendanceStats.present}</span>
                      <span className="text-emerald-600 font-bold ml-1">days</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Total</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-700">{attendanceStats.total}</span>
                      <span className="text-gray-500 font-bold ml-1">sessions</span>
                    </div>
                  </div>
                </div>

                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-100"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * attendanceRate) / 100}
                      strokeLinecap="round"
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{attendanceRate}%</span>
                    <span className="text-xs font-bold text-emerald-600">Excellent</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 text-gray-500 text-sm italic">
                {attendanceInsight}
              </div>
            </section>

            <section id="report-section-score" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">Academic Performance</h2>
                <p className="text-gray-500 text-sm">Subject-wise breakdown from recent school exams</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">SCORE COMPARISON</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="subject"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <RechartsTooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar
                        dataKey="average"
                        radius={[8, 8, 8, 8]}
                        barSize={40}
                      >
                        {subjectBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectBreakdown.map((entry, index) => {
                  const isSelected = selectedSubject === entry.subject;
                  return (
                    <button
                      key={entry.subject}
                      type="button"
                      onClick={() => setSelectedSubject(entry.subject)}
                      data-cy="subject-card"
                      data-subject={entry.subject}
                      className={`text-left bg-white rounded-2xl p-5 border shadow-sm space-y-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm font-medium">{entry.subject}</span>
                        <span className="text-gray-400 text-xs">Ms. Sarah</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold text-gray-900">{Math.round(entry.average)}%</div>
                        <div className="flex items-center text-emerald-500 text-xs font-bold">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> 3
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-gray-400 font-bold uppercase tracking-[0.1em]">Performance</span>
                          <span className="text-emerald-500 font-bold uppercase tracking-[0.1em]">Excellent</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${entry.average}%`,
                              backgroundColor: EXAM_SUBJECT_COLORS[index % EXAM_SUBJECT_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-gray-50/60 rounded-2xl p-6 border border-gray-100" data-cy="subject-records">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Subject Records</h3>
                    <p className="text-gray-500 text-sm">
                      {selectedSubject ? `${selectedSubject} history for ${formatMonthLabel(reportMonthStart)}` : 'Select a subject to view details'}
                    </p>
                  </div>
                  {selectedSubject && (
                    <span className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-gray-600 border border-gray-200">
                      {subjectHistory.length} records
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {selectedSubject && subjectHistory.length > 0 ? (
                    subjectHistory.map((score, idx) => (
                      <div key={`${score.subject}-${idx}`} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{score.type || 'Assessment'}</p>
                          <p className="text-xs text-gray-500">{formatScoreDate(score.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900">{score.value}</p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">{score.remark ? 'Remarked' : 'No remark'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No records available for this subject in the selected month.</div>
                  )}
                </div>
              </div>
            </section>
            {/* Assessments & Quizzes Section */}
            <section id="report-section-quiz" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">Assessments & Quizzes</h2>
                <p className="text-gray-500 text-sm">Weekly performance tracking</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 relative">
                  <div className="absolute top-6 right-6 p-2 bg-cyan-50 rounded-lg text-cyan-500">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">QUIZ AVERAGE</p>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-gray-900">{tutoringAverage ? Math.round(tutoringAverage) : '-'}%</span>
                        <span className="text-emerald-500 text-sm font-bold flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" /> +5%
                        </span>
                      </div>
                    </div>

                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tutoringSeries[0]?.data || []}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={[0, 100]} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-gray-400 text-xs font-medium">Last 4 weeks performance trend</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">RECENT ACTIVITY</p>
                  <div className="space-y-6">
                    {tutoringAssessments.slice(0, 4).map((score, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${score.subject === 'Mathematics' ? 'bg-blue-50 text-blue-500' :
                            score.subject === 'English' ? 'bg-purple-50 text-purple-500' :
                              score.subject === 'Science' ? 'bg-emerald-50 text-emerald-500' :
                                'bg-amber-50 text-amber-500'
                            }`}>
                            {score.subject === 'Mathematics' ? '📐' :
                              score.subject === 'English' ? '📝' :
                                score.subject === 'Science' ? '🔬' : '📜'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{score.subject}</p>
                            <p className="text-gray-400 text-xs">{score.type} • {formatScoreDate(score.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-emerald-600">{score.value}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Refined Engagement & Behavior Section */}
            <section id="report-section-feedback" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold text-gray-900">Engagement & Behavior</h2>
                  <p className="text-gray-500 text-sm">Classroom participation and learning attitude</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12">
                <div className="bg-[#f0f9ff]/50 rounded-[2rem] p-8 border border-[#e0f2fe] space-y-8 flex flex-col items-center justify-center text-center">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1 justify-center">
                      <span className="text-6xl font-bold text-[#0284c7]">{avgClassRating}</span>
                      <span className="text-2xl font-bold text-gray-400">/5.0</span>
                    </div>
                    <p className="text-[#0284c7] font-bold text-sm tracking-tight">Overall Engagement Score</p>
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4].map(star => <Star key={star} className="w-5 h-5 fill-[#38bdf8] text-[#38bdf8]" />)}
                      <Star className="w-5 h-5 fill-[#bae6fd] text-[#bae6fd]" />
                    </div>
                  </div>

                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                        <PolarGrid stroke="#e0f2fe" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#0369a1', fontSize: 11, fontWeight: 600 }} />
                        <Radar
                          name="Student"
                          dataKey="A"
                          stroke="#0ea5e9"
                          fill="#0ea5e9"
                          fillOpacity={0.15}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800">Engagement Breakdown</h3>
                    <div className="space-y-8">
                      {radarChartData.map((indicator, idx) => {
                        const percentage = Math.round((indicator.A / 5) * 100);
                        const showSparkle = percentage >= 95;
                        return (
                          <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-gray-600">{indicator.subject}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-gray-900">{percentage}%</span>
                                {showSparkle && <Sparkles className="w-4 h-4 text-amber-400" />}
                              </div>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${idx % 2 === 0 ? 'bg-[#34d399]' : 'bg-[#818cf8]'
                                  }`}
                                style={{ width: `${(indicator.A / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-2xl p-6 border border-[#e2e8f0] border-l-4 border-l-[#3b82f6] space-y-3 relative flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                      <Zap className="w-6 h-6 fill-blue-50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">TEACHER'S NOTE</p>
                      <p className="text-gray-600 text-sm leading-relaxed font-medium">
                        {selectedStudent.name} demonstrates excellent attention in class and completes homework consistently. Continue encouraging independent practice to further strengthen learning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance & Sessions Details Section (Added from image) */}
            <section id="report-section-attendance-details" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-bold text-gray-900">Attendance & Sessions</h2>
                    <p className="text-gray-500 text-sm">Monthly attendance tracking</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
              </div>

              <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">{attendanceRate}%</div>
                  <p className="text-emerald-600 text-sm font-medium">Excellent attendance reflects strong learning discipline and consistent class participation.</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="py-4 text-gray-500 font-bold uppercase tracking-wider text-[10px]">Date</TableHead>
                      <TableHead className="py-4 text-gray-500 font-bold uppercase tracking-wider text-[10px]">Day</TableHead>
                      <TableHead className="py-4 text-gray-500 font-bold uppercase tracking-wider text-[10px]">Session</TableHead>
                      <TableHead className="py-4 text-gray-500 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSessions.map((session, idx) => {
                      const attRecord = attendance.find((a) => a.sessionId === session.id && a.studentId === selectedStudentId);
                      const status = attRecord?.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';
                      const dateObj = new Date(session.date);
                      const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      const classItem = classes.find((c) => c.id === session.classId);

                      return (
                        <TableRow key={idx} className="hover:bg-gray-50/30 border-t border-gray-50">
                          <TableCell className="py-5 font-medium text-gray-700">{formattedDate}</TableCell>
                          <TableCell className="py-5 text-gray-500">{dayName}</TableCell>
                          <TableCell className="py-5 text-gray-700">{classItem?.name || '-'}</TableCell>
                          <TableCell className="py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${status === 'PRESENT' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'
                              }`}>
                              {status === 'PRESENT' ? 'Present' : 'Absent'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {attendancePageCount > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Page {attendancePage} of {attendancePageCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
                      onClick={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
                      disabled={attendancePage === 1}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
                      onClick={() => setAttendancePage((prev) => Math.min(attendancePageCount, prev + 1))}
                      disabled={attendancePage === attendancePageCount}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Redesigned Sessions Schedule Section */}
            <section id="student-report-schedule" className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">Sessions Schedule (by Month)</h2>
                <p className="text-gray-500 text-sm">Detailed log of attended classes and session feedback</p>
              </div>

              <div className="flex items-center gap-6 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-700">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-gray-700">Absent</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-end gap-4">
                  <div className="w-full xl:max-w-sm space-y-1">
                    <label htmlFor="schedule-teacher-filter" className="text-sm font-bold text-gray-800">
                      Teacher
                    </label>
                    <Select
                      id="schedule-teacher-filter"
                      value={scheduleTeacherFilter}
                      onChange={(e) => setScheduleTeacherFilter(e.target.value)}
                      className="h-12 bg-white text-sm font-medium border-gray-300"
                    >
                      <option value="ALL">All teachers</option>
                      {scheduleFilterOptions.teachers.map((teacherName) => (
                        <option key={teacherName} value={teacherName}>
                          {teacherName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-full xl:max-w-sm space-y-1">
                    <label htmlFor="schedule-subject-filter" className="text-sm font-bold text-gray-800">
                      Subject
                    </label>
                    <Select
                      id="schedule-subject-filter"
                      value={scheduleSubjectFilter}
                      onChange={(e) => setScheduleSubjectFilter(e.target.value)}
                      className="h-12 bg-white text-sm font-medium border-gray-300"
                    >
                      <option value="ALL">All subjects</option>
                      {scheduleFilterOptions.subjects.map((subjectName) => (
                        <option key={subjectName} value={subjectName}>
                          {subjectName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="xl:ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-4 text-sm font-semibold"
                      onClick={() => {
                        setScheduleTeacherFilter('ALL');
                        setScheduleSubjectFilter('ALL');
                      }}
                      disabled={scheduleTeacherFilter === 'ALL' && scheduleSubjectFilter === 'ALL'}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Showing {filteredScheduleSessionsInView.length} of {sortedSessionsInView.length} sessions
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b-0">
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">DATE & TIME</TableHead>
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">CLASS NAME</TableHead>
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">ASSIGNED TEACHER</TableHead>
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">STATUS</TableHead>
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">RATING</TableHead>
                      <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">REASON FOR ABSENCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleSessions.map((session) => {
                      const attRecord = attendance.find((a) => a.sessionId === session.id && a.studentId === selectedStudentId);
                      const status = attRecord?.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';
                      const sessionBehaviors = behaviors.filter((b) => b.sessionId === session.id && b.studentId === selectedStudentId);
                      const avgBehavior = sessionBehaviors.length > 0
                        ? (sessionBehaviors.reduce((a, b) => a + b.rating, 0) / sessionBehaviors.length).toFixed(1)
                        : null;

                      const dateObj = new Date(session.date);
                      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
                      const classItem = classMap.get(session.classId);
                      const teacher = classItem?.teacherId ? teacherMap.get(classItem.teacherId) : null;

                      return (
                        <TableRow key={session.id} className="hover:bg-gray-50/30 border-t border-gray-50">
                          <TableCell className="py-6">
                            <div className="space-y-1">
                              <p className="font-bold text-gray-700">{formattedDate}</p>
                              <p className="text-gray-400 text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {session.startTime}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <span className="text-blue-500 font-bold text-sm cursor-pointer hover:underline">{classItem?.name}</span>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
                                {teacher?.name?.substring(0, 1) || '👤'}
                              </div>
                              <span className="text-gray-600 font-medium text-sm">{teacher?.name || 'Assigned'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${status === 'PRESENT' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                              }`}>
                              {status === 'PRESENT' ? 'Present' : 'Absent'}
                            </span>
                          </TableCell>
                          <TableCell className="py-6">
                            {avgBehavior ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-gray-700 text-sm">{avgBehavior}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-6 text-gray-400 text-sm">
                            {attRecord?.status === 'ABSENT' ? (attRecord.reason || 'Unexcused') : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {scheduleSessions.length === 0 && (
                      <TableRow className="border-t border-gray-50">
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500 font-medium">
                          No sessions match the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {schedulePageCount > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Page {schedulePage} of {schedulePageCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
                      onClick={() => setSchedulePage((prev) => Math.max(1, prev - 1))}
                      disabled={schedulePage === 1}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 disabled:opacity-40"
                      onClick={() => setSchedulePage((prev) => Math.min(schedulePageCount, prev + 1))}
                      disabled={schedulePage === schedulePageCount}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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
