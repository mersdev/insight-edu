
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, AlertCircle, TrendingUp, MapPin, School, Calendar, Activity, Star, Download, ChevronRight, BookOpen } from 'lucide-react';
import { Card, Button, Badge, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { Student, ClassGroup, Location, Session, BehaviorRating, AttendanceRecord, RatingCategory } from '../../types';
import { AIInsightSection } from '../../components/AIInsightSection';
import { generateDashboardInsights } from '../../services/geminiService';
import { api } from '../../services/backendApi';
import { calculateAverageAttendance } from '../../utils/attendanceCalculator';

interface HQDashboardProps {
  t: any;
  students: Student[];
  classes: ClassGroup[];
  locations: Location[];
  ratingCategories: RatingCategory[];
}

const DEFAULT_BEHAVIOR_CATEGORIES = ['Attention', 'Participation', 'Homework', 'Behavior', 'Practice'];

export const HQDashboard: React.FC<HQDashboardProps> = ({ t, students, classes, locations, ratingCategories }) => {
  const [insightText, setInsightText] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatingAttendance, setCalculatingAttendance] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorRating[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Location Dialog State
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Use a ref to prevent double-firing in strict mode or rapid re-renders
  const hasCheckedAutoUpdate = useRef(false);

  // Load Data
  useEffect(() => {
    const initData = async () => {
        try {
            setLoading(true);
            const [fetchedSessions, fetchedBehaviors, fetchedAttendance, settings] = await Promise.all([
                api.fetchSessions(),
                api.fetchBehaviors(),
                api.fetchAttendance(),
                api.fetchSettings()
            ]);
            setSessions(fetchedSessions);
            setBehaviors(fetchedBehaviors);
            setAttendance(fetchedAttendance);

            if (settings.dashboardInsight) {
                setInsightText(settings.dashboardInsight);
                setLastUpdated(settings.lastAnalyzed);
            }

            // Auto-update check: use configurable threshold from settings
            const now = new Date();
            const last = settings.lastAnalyzed ? new Date(settings.lastAnalyzed) : null;
            const autoUpdateHours = settings.insightAutoUpdateHours || 12;
            const thresholdMs = autoUpdateHours * 60 * 60 * 1000;

            if (!hasCheckedAutoUpdate.current && (!last || (now.getTime() - last.getTime() > thresholdMs))) {
                hasCheckedAutoUpdate.current = true;
                console.log(`Auto-updating AI insights (threshold: ${autoUpdateHours} hours)`);
                await handleGenerate();
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };
    initData();
  }, []);

  // Handle generation and persistence
  const handleGenerate = async (): Promise<string> => {
    // Calculate actual attendance from completed sessions
    const actualAvgAttendance = calculateAverageAttendance(students, sessions, attendance);

    // Pass comprehensive data to AI
    const text = await generateDashboardInsights(students, {
      actualAvgAttendance,
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'COMPLETED').length,
      totalLocations: locations.length,
      totalClasses: classes.length
    });
    const now = new Date().toISOString();

    setInsightText(text);
    setLastUpdated(now);

    await api.updateSettings({
      dashboardInsight: text,
      lastAnalyzed: now
    });
    return text;
  };

  const handleScreenshot = async (elementId: string, filename: string) => {
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
        link.download = filename;
        link.click();
      } catch (err) {
        console.error('Screenshot failed', err);
        alert('Failed to capture screenshot. Please try again.');
      } finally {
        element.style.overflow = originalOverflow;
        element.style.maxHeight = originalMaxHeight;
      }
  };

  // --- Calculations ---

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. KPI Cards
  const totalStudents = students.length;
  const atRiskStudents = students.filter(s => s.atRisk).length;

  // Calculate average attendance from actual attendance records using centralized utility
  const avgAttendance = useMemo(() => {
    setCalculatingAttendance(true);
    const result = calculateAverageAttendance(students, sessions, attendance);
    // Use setTimeout to ensure the loading state is visible
    setTimeout(() => setCalculatingAttendance(false), 100);
    return result;
  }, [students, sessions, attendance]);

  const kpiCards = [
    { title: t.totalStudents, value: totalStudents, icon: Users, sub: totalStudents > 0 ? t.activeStudents : t.noStudentData, color: "text-blue-600", bg: "bg-blue-50" },
    { title: t.locations, value: locations.length, icon: MapPin, sub: t.activeCampuses, color: "text-purple-600", bg: "bg-purple-50" },
    { title: t.classes, value: classes.length, icon: School, sub: t.totalClasses, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: t.avgAttendance, value: `${avgAttendance}%`, icon: Activity, sub: t.globalAverage, color: "text-green-600", bg: "bg-green-50" },
  ];

  // 2. Location Analysis (Overview Cards)
  const locationAnalytics = useMemo(() => {
      const analytics = locations.map(loc => {
          const locClasses = classes.filter(c => c.locationId === loc.id);
          const locClassIds = locClasses.map(c => c.id);

          const locStudents = students.filter(s =>
              (s.classIds || []).some(id => locClassIds.includes(id))
          );

          const activeSessions = sessions.filter(s => {
              const d = new Date(s.date);
              return locClassIds.includes(s.classId) &&
                     d.getMonth() === currentMonth &&
                     d.getFullYear() === currentYear &&
                     s.status !== 'CANCELLED';
          }).length;

          // Get all completed sessions for this location
          const completedSessions = sessions.filter(s =>
              locClassIds.includes(s.classId) && s.status === 'COMPLETED'
          );
          const completedSessionIds = completedSessions.map(s => s.id);

          // Calculate average attendance for this location
          const locAttendance = attendance.filter(a => completedSessionIds.includes(a.sessionId));
          const avgAttendance = locAttendance.length > 0
                ? Math.round((locAttendance.filter(a => a.status === 'PRESENT').length / locAttendance.length) * 100)
                : 0;

          // Calculate average behavior for this location
          const locBehaviors = behaviors.filter(b => b.sessionId && completedSessionIds.includes(b.sessionId));
          const avgBehavior = locBehaviors.length > 0
                ? parseFloat((locBehaviors.reduce((acc, b) => acc + b.rating, 0) / locBehaviors.length).toFixed(1))
                : 0;

          const result = {
              id: loc.id,
              name: loc.name,
              address: loc.address,
              studentCount: locStudents.length,
              classCount: locClasses.length,
              activeSessions,
              avgAttendance,
              avgBehavior
          };

          // Debug logging
          console.log(`Location: ${loc.name}`, {
              completedSessions: completedSessions.length,
              attendanceRecords: locAttendance.length,
              avgAttendance,
              behaviorRecords: locBehaviors.length,
              avgBehavior
          });

          return result;
      }).sort((a, b) => b.studentCount - a.studentCount);

      return analytics;
  }, [locations, classes, students, sessions, attendance, behaviors, currentMonth, currentYear]);

  // 3. Trend Analysis (Global - Last 6 Months)
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const monthKey = d.getMonth();
        const yearKey = d.getFullYear();

        const monthSessions = sessions.filter(s => {
            const sd = new Date(s.date);
            return sd.getMonth() === monthKey && sd.getFullYear() === yearKey && s.status === 'COMPLETED';
        });
        const monthSessionIds = monthSessions.map(s => s.id);

        const relevantAttendance = attendance.filter(a => monthSessionIds.includes(a.sessionId));
        let attPerc = 0;
        if (relevantAttendance.length > 0) {
            const present = relevantAttendance.filter(a => a.status === 'PRESENT').length;
            attPerc = Math.round((present / relevantAttendance.length) * 100);
        }

        const relevantBehaviors = behaviors.filter(b => b.sessionId && monthSessionIds.includes(b.sessionId));
        let behAvg = 0;
        if (relevantBehaviors.length > 0) {
            const sum = relevantBehaviors.reduce((acc, b) => acc + b.rating, 0);
            behAvg = parseFloat((sum / relevantBehaviors.length).toFixed(1));
        }

        if (monthSessionIds.length > 0 || i === 0) {
             data.push({
                name: monthLabel,
                attendance: attPerc,
                behavior: behAvg
            });
        }
    }
    if (data.length === 0) {
        data.push({ name: 'No Data', attendance: 0, behavior: 0 });
    }
    return data;
  }, [sessions, attendance, behaviors]);

  // 4. Behavior Category Analysis
  const categoryData = useMemo(() => {
    const categories = ratingCategories.length > 0
      ? ratingCategories.map((category) => category.name)
      : DEFAULT_BEHAVIOR_CATEGORIES;
    return categories.map(cat => {
        const catBehaviors = behaviors.filter(b => b.category === cat);
        const avg = catBehaviors.length > 0 
            ? parseFloat((catBehaviors.reduce((a, b) => a + b.rating, 0) / catBehaviors.length).toFixed(1))
            : 0;
        return { name: cat, value: avg };
    });
  }, [behaviors, ratingCategories]);

  // --- Selected Location Report Data ---
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const selectedLocData = useMemo(() => {
      if (!selectedLocationId) return null;

      const locClasses = classes.filter(c => c.locationId === selectedLocationId);
      const locClassIds = locClasses.map(c => c.id);
      
      const locStudents = students.filter(s => 
          (s.classIds || []).some(id => locClassIds.includes(id))
      );

      // Class Breakdown
      const classBreakdown = locClasses.map(c => {
          const cStudents = students.filter(s => (s.classIds || []).includes(c.id));
          // Only use COMPLETED sessions for accurate metrics
          const cSessions = sessions.filter(s => s.classId === c.id && s.status === 'COMPLETED');
          const cSessionIds = cSessions.map(s => s.id);

          const cAttendance = attendance.filter(a => cSessionIds.includes(a.sessionId));
          const attRate = cAttendance.length > 0
              ? Math.round((cAttendance.filter(a => a.status === 'PRESENT').length / cAttendance.length) * 100)
              : 0;

          const cBehaviors = behaviors.filter(b => b.sessionId && cSessionIds.includes(b.sessionId));
          const avgBeh = cBehaviors.length > 0
              ? (cBehaviors.reduce((sum, b) => sum + b.rating, 0) / cBehaviors.length).toFixed(1)
              : 0;

          console.log(`Class ${c.name}:`, {
              completedSessions: cSessions.length,
              attendance: cAttendance.length,
              attRate,
              behaviors: cBehaviors.length,
              avgBeh
          });

          return {
              name: c.name,
              students: cStudents.length,
              attendance: attRate,
              behavior: Number(avgBeh)
          };
      });

      // Location Trend (Last 6 Months)
      const locTrend = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthLabel = d.toLocaleString('default', { month: 'short' });
          const monthKey = d.getMonth();
          const yearKey = d.getFullYear();

          const monthSessions = sessions.filter(s => {
              const sd = new Date(s.date);
              return locClassIds.includes(s.classId) && sd.getMonth() === monthKey && sd.getFullYear() === yearKey && s.status === 'COMPLETED';
          });
          const monthSessionIds = monthSessions.map(s => s.id);

          const relevantAttendance = attendance.filter(a => monthSessionIds.includes(a.sessionId));
          let attPerc = 0;
          if (relevantAttendance.length > 0) {
              const present = relevantAttendance.filter(a => a.status === 'PRESENT').length;
              attPerc = Math.round((present / relevantAttendance.length) * 100);
          }

          const relevantBehaviors = behaviors.filter(b => b.sessionId && monthSessionIds.includes(b.sessionId));
          let behAvg = 0;
          if (relevantBehaviors.length > 0) {
              const sum = relevantBehaviors.reduce((acc, b) => acc + b.rating, 0);
              behAvg = parseFloat((sum / relevantBehaviors.length).toFixed(1));
          }

          console.log(`Trend ${monthLabel} ${yearKey}:`, {
              sessions: monthSessions.length,
              attendance: relevantAttendance.length,
              attPerc,
              behaviors: relevantBehaviors.length,
              behAvg
          });

          // Always push data for all 6 months (even if 0) for consistent graph
          locTrend.push({
              name: monthLabel,
              attendance: attPerc,
              behavior: behAvg
          });
      }

      // Calculate overall attendance and behavior from ALL completed sessions
      const allCompletedSessions = sessions.filter(s =>
          locClassIds.includes(s.classId) && s.status === 'COMPLETED'
      );
      const allCompletedSessionIds = allCompletedSessions.map(s => s.id);

      // Overall attendance
      const allAttendance = attendance.filter(a => allCompletedSessionIds.includes(a.sessionId));
      const overallAvgAttendance = allAttendance.length > 0
          ? Math.round((allAttendance.filter(a => a.status === 'PRESENT').length / allAttendance.length) * 100)
          : 0;

      // Overall behavior
      const allBehaviors = behaviors.filter(b => b.sessionId && allCompletedSessionIds.includes(b.sessionId));
      const overallAvgBehavior = allBehaviors.length > 0
          ? parseFloat((allBehaviors.reduce((acc, b) => acc + b.rating, 0) / allBehaviors.length).toFixed(1))
          : 0;

      console.log(`Selected Location Data for ${selectedLocationId}:`, {
          completedSessions: allCompletedSessions.length,
          attendanceRecords: allAttendance.length,
          avgAttendance: overallAvgAttendance,
          behaviorRecords: allBehaviors.length,
          avgBehavior: overallAvgBehavior
      });

      return {
          totalStudents: locStudents.length,
          avgAttendance: overallAvgAttendance,
          avgBehavior: overallAvgBehavior,
          classBreakdown,
          trend: locTrend
      };

  }, [selectedLocationId, classes, students, sessions, attendance, behaviors]);

  const createPrintablePages = () => {
    const pageWidthPx = 880;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-dashboard-section]'));
    if (sections.length === 0) return null;

    const sectionByKey: Record<string, HTMLElement | null> = {
      header: document.querySelector('[data-dashboard-section="header"]'),
      ai: document.querySelector('[data-dashboard-section="ai-insight"]'),
      kpi: document.querySelector('[data-dashboard-section="kpi"]'),
      locations: document.querySelector('[data-dashboard-section="locations"]'),
      charts: document.querySelector('[data-dashboard-section="charts"]'),
    };

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
    const appendPage = (clones: HTMLElement[]) => {
      const valid = clones.filter(Boolean);
      if (!valid.length) return;
      const page = document.createElement('div');
      page.style.width = `${pageWidthPx}px`;
      page.style.margin = '0 auto';
      page.style.padding = '32px';
      page.style.borderRadius = '16px';
      page.style.backgroundColor = '#ffffff';
      page.style.boxSizing = 'border-box';
      page.style.display = 'flex';
      page.style.flexDirection = 'column';
      page.style.gap = '20px';
      page.style.pageBreakAfter = 'always';
      valid.forEach((clone) => {
        clone.style.width = '100%';
        clone.style.boxSizing = 'border-box';
        clone.querySelectorAll<HTMLElement>('.recharts-responsive-container').forEach((chart) => {
          chart.style.width = '100%';
          chart.style.height = '260px';
        });
        page.appendChild(clone);
      });
      wrapper.appendChild(page);
      pages.push(page);
    };

    // Two-page layout: Page 1 (Header, AI, KPI, Locations), Page 2 (Charts/Trend)
    const page1Clones = ['header', 'ai', 'kpi', 'locations']
      .map((key) => (sectionByKey[key] ? sectionByKey[key]!.cloneNode(true) as HTMLElement : null))
      .filter(Boolean) as HTMLElement[];
    const page2Clones = ['charts']
      .map((key) => (sectionByKey[key] ? sectionByKey[key]!.cloneNode(true) as HTMLElement : null))
      .filter(Boolean) as HTMLElement[];

    appendPage(page1Clones);
    appendPage(page2Clones);

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
      printable?.container.remove();
    }
  };

  const handleExportPdf = async () => {
    try {
      const canvases = await capturePrintablePages();
      if (!canvases.length) return;

      const jspdf = (window as any).jspdf;
      const jsPDFConstructor = jspdf?.jsPDF;
      const images = canvases.map((c) => c.toDataURL('image/png'));

      const downloadPng = () => {
        const link = document.createElement('a');
        link.href = images[0];
        link.download = `HQ_Dashboard_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      };

      if (!jsPDFConstructor) {
        downloadPng();
        return;
      }

      const pdf = new jsPDFConstructor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      images.forEach((img, index) => {
        if (index > 0) pdf.addPage();
        const canvas = canvases[index];
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imgW = canvas.width * scale;
        const imgH = canvas.height * scale;
        const x = (pdfWidth - imgW) / 2;
        const y = 0;
        pdf.addImage(img, 'PNG', x, y, imgW, imgH);
      });
      pdf.save(`HQ_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('HQ Dashboard export failed', err);
      alert('Failed to export dashboard. Please try again.');
    }
  };

  return (
    <div id="hq-dashboard-root" className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-dashboard-section="header">
           <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.dashboard}</h1>
                <p className="text-muted-foreground">{t.dashboardOverview}</p>
           </div>
           <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </div>
              <Button size="sm" className="bg-black text-white hover:bg-black/90" onClick={handleExportPdf}>
                <Download className="w-4 h-4 mr-2" />
                {t.exportPDF || 'Export PDF'}
              </Button>
           </div>
      </div>

      <section data-dashboard-section="ai-insight">
      <AIInsightSection 
         title={t.hqAiSummary}
         onGenerate={handleGenerate}
         defaultText={insightText || t.clickToAnalyze}
         lastUpdated={lastUpdated || undefined}
         isLoading={loading}
      />
      </section>

      {/* KPI Grid */}
      <section data-dashboard-section="kpi" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const isAttendanceCard = kpi.title === t.avgAttendance;
          const isCalculating = isAttendanceCard && calculatingAttendance;

          return (
            <Card key={idx} className="p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all bg-white">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{kpi.title}</h3>
                 <div className={`p-2 rounded-full ${kpi.bg}`}>
                     <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                 </div>
              </div>
              <div className="content mt-2">
                 {isCalculating ? (
                   <div className="flex items-center gap-2">
                     <div className="h-9 w-24 bg-gray-200 animate-pulse rounded"></div>
                     <div className="text-xs text-muted-foreground">Calculating...</div>
                   </div>
                 ) : (
                   <>
                     <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                     <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                   </>
                 )}
              </div>
            </Card>
          );
        })}
      </section>

      {/* Location Breakdown */}
      <section data-dashboard-section="locations">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              {t.locationPerformanceOverview}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {locationAnalytics.map(loc => (
                  <Card
                    key={loc.id}
                    className="p-5 border border-gray-200 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelectedLocationId(loc.id)}
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div className="overflow-hidden">
                              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{loc.name}</h3>
                              <p className="text-xs text-muted-foreground">{loc.classCount} Classes</p>
                          </div>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 shrink-0">
                              {loc.studentCount} Students
                          </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t.avgAttendance}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                  <Activity className="w-4 h-4 text-green-500" />
                                  <span className="font-semibold text-lg">{loc.avgAttendance}%</span>
                              </div>
                          </div>
                          <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Behavior</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-semibold text-lg">{loc.avgBehavior > 0 ? loc.avgBehavior : '-'}</span>
                              </div>
                          </div>
                      </div>
                      <div className="mt-3 text-xs text-primary flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.viewReport} <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                  </Card>
              ))}
          </div>
      </section>

      {/* Advanced Charts Grid */}
      <section data-dashboard-section="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Line Chart */}
          <Card title={t.institutionTrends} description={t.institutionTrendsDesc}>
              <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                          <Tooltip 
                              contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} 
                          />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="attendance" name="Attendance (%)" stroke="#16a34a" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                          <Line yAxisId="right" type="monotone" dataKey="behavior" name="Avg Behavior (1-5)" stroke="#2563eb" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          {/* Behavior Breakdown Bar Chart */}
          <Card title={t.behaviorAnalysis} description={t.behaviorAnalysisDesc}>
              <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                          <Tooltip 
                              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                              contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="value" name="Avg Rating" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40}>
                             {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value < 3.5 ? '#ef4444' : 'hsl(var(--primary))'} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Student Distribution Chart */}
        <Card title={t.studentDistribution} description={t.studentDistributionDesc} className="lg:col-span-4 min-h-[350px]">
           <div className="h-[300px] w-full pt-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={locationAnalytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="studentCount" name="Students" radius={[0, 4, 4, 0]} barSize={32}>
                    {locationAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>

        {/* At Risk Students List (Retained as requested) */}
        <Card title={t.atRisk} description={t.studentsNeedingSupport} className="lg:col-span-3 min-h-[350px] flex flex-col">
          <div className="space-y-4 pt-2 flex-1 overflow-y-auto max-h-[300px] pr-2">
             {students.filter(s => s.atRisk).map(student => (
               <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-red-50/30 border-red-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium text-sm text-foreground">{student.name}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-white border px-1.5 rounded text-muted-foreground">
                                {classes.find(c => (student.classIds || []).includes(c.id))?.name || 'No Class'}
                            </span>
                        </div>
                    </div>
                  </div>
                  <div className="text-right">
                      <span className="text-xs font-bold text-red-600">{student.attendance}% Att.</span>
                  </div>
               </div>
             ))}
             {students.filter(s => s.atRisk).length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                    {students.length === 0 ? t.noStudentData : t.noStudentsAtRisk}
                 </div>
             )}
          </div>
        </Card>
      </div>

      {/* Location Report Dialog */}
      <Dialog
        isOpen={!!selectedLocationId}
        onClose={() => setSelectedLocationId(null)}
        title={selectedLocation?.name || t.locationReport}
        className="max-w-4xl"
      >
        <div id="location-report-content" className="space-y-6 max-h-[80vh] overflow-y-auto p-4 bg-background">
             {selectedLocation && selectedLocData && (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                              {selectedLocation.name} 
                              <span className="text-sm font-normal text-muted-foreground border px-2 py-0.5 rounded-full">Report</span>
                          </h2>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4" /> 
                              <span className="text-sm">{selectedLocation.address || "No address provided"}</span>
                          </div>
                      </div>
                      <Button size="sm" onClick={() => handleScreenshot('location-report-content', `Location_Report_${selectedLocation.name}.png`)} className="bg-black text-white hover:bg-black/90">
                           <Download className="w-4 h-4 mr-2" /> {t.exportPDF}
                      </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4 flex flex-col items-center justify-center text-center bg-blue-50/50 border-blue-100">
                           <div className="text-3xl font-bold text-blue-700">{selectedLocData.totalStudents}</div>
                           <div className="text-xs font-bold text-blue-600/70 uppercase">{t.totalStudents}</div>
                      </Card>
                      <Card className="p-4 flex flex-col items-center justify-center text-center bg-green-50/50 border-green-100">
                           <div className="text-3xl font-bold text-green-700">{selectedLocData.avgAttendance}%</div>
                           <div className="text-xs font-bold text-green-600/70 uppercase">{t.avgAttendance}</div>
                      </Card>
                      <Card className="p-4 flex flex-col items-center justify-center text-center bg-purple-50/50 border-purple-100">
                           <div className="text-3xl font-bold text-purple-700">{selectedLocData.avgBehavior}</div>
                           <div className="text-xs font-bold text-purple-600/70 uppercase">Avg Behavior</div>
                      </Card>
                  </div>

                  {/* Graphs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4 bg-card shadow-sm">
                          <h4 className="text-sm font-semibold mb-4 text-center">{t.branchTrend}</h4>
                          <div className="h-[250px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={selectedLocData.trend}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                      <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                      <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} domain={[0, 5]} />
                                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                                      <Legend />
                                      <Line yAxisId="left" type="monotone" dataKey="attendance" name="Attendance (%)" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                                      <Line yAxisId="right" type="monotone" dataKey="behavior" name="Behavior (Avg)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-card shadow-sm">
                          <h4 className="text-sm font-semibold mb-4 text-center">{t.classComparison}</h4>
                          <div className="h-[250px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={selectedLocData.classBreakdown} layout="vertical" margin={{ left: 10, right: 10 }}>
                                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                      <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                      <YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} axisLine={false} />
                                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                                      <Bar dataKey="attendance" name="Attendance %" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  </div>

                  {/* Class Breakdown List */}
                  <div>
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          {t.classBreakdown}
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                          <Table>
                              <TableHeader>
                                  <TableRow className="bg-muted/50">
                                      <TableHead>{t.className}</TableHead>
                                      <TableHead className="text-center">{t.totalStudents}</TableHead>
                                      <TableHead className="text-center">{t.avgAttendance}</TableHead>
                                      <TableHead className="text-center">Avg Behavior</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {selectedLocData.classBreakdown.map((c, idx) => (
                                      <TableRow key={idx}>
                                          <TableCell className="font-medium">{c.name}</TableCell>
                                          <TableCell className="text-center">{c.students}</TableCell>
                                          <TableCell className="text-center">
                                              <Badge variant={c.attendance >= 90 ? 'secondary' : c.attendance >= 75 ? 'outline' : 'destructive'} className={c.attendance >= 90 ? 'bg-green-100 text-green-700' : ''}>
                                                  {c.attendance}%
                                              </Badge>
                                          </TableCell>
                                          <TableCell className="text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                  {c.behavior}
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                                  {selectedLocData.classBreakdown.length === 0 && (
                                      <TableRow>
                                          <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                              {t.noClassesInLocation}
                                          </TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </div>
                </>
             )}
        </div>
      </Dialog>
    </div>
  );
};
