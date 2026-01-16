import { GoogleGenAI } from "@google/genai";
import { Insight, Student, Score, BehaviorRating, Teacher, ClassGroup, Session } from "../types";

// Prefer Vite env var, then common fallbacks.
const API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  '';

const ai = new GoogleGenAI({ apiKey: API_KEY });
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';
const DEFAULT_CONFIG = { thinkingConfig: { thinkingLevel: 'low' } };

const generateWithFallbackModel = async (prompt: string, config?: Record<string, unknown>) => {
  if (!API_KEY) return null;
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  for (const model of models) {
    try {
      const { config: overrideConfig, ...rest } = config || {};
      const mergedConfig = {
        ...DEFAULT_CONFIG,
        ...(overrideConfig as Record<string, unknown> | undefined),
      };

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: mergedConfig,
        ...rest,
      });

      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.error(`AI model ${model} error:`, error);
    }
  }
  return null;
};

// General helper for generating content
const generateAIContent = async (prompt: string, fallbackMessage: string) => {
  const text = await generateWithFallbackModel(prompt);
  return text || fallbackMessage;
};

export const generateDashboardInsights = async (
    students: Student[],
    metrics?: {
        actualAvgAttendance?: number;
        totalSessions?: number;
        completedSessions?: number;
        totalClasses?: number;
    }
): Promise<string> => {
    const atRiskCount = students.filter(s => s.atRisk).length;
    const avgAttendance = metrics?.actualAvgAttendance ??
        (students.reduce((acc, s) => acc + s.attendance, 0) / (students.length || 1));

    const prompt = `
      Analyze the institution's health with the metrics below and return:
      1. A two-sentence **executive summary** referencing the most important metric.
      2. Two **focus areas** needing attention (list each as a Markdown bullet and bold the metric that drives concern).
      3. Two actionable steps for HQ leadership, each prefixed with "- **Next Step:**", that the admin team should take next based on the data.

      **Student Metrics:**
      - Total Students: ${students.length}
      - At Risk Students: ${atRiskCount} (${((atRiskCount / (students.length || 1)) * 100).toFixed(1)}%)
      - Average Attendance: ${avgAttendance.toFixed(1)}%

      **Operational Metrics:**
      - Total Classes: ${metrics?.totalClasses || 'N/A'}
      - Total Sessions: ${metrics?.totalSessions || 'N/A'}
      - Completed Sessions: ${metrics?.completedSessions || 'N/A'}

      Use Markdown with bolded key metrics, and keep the tone strategic yet actionable.
    `;

    const fallback = `
      **Institution Overview:** Serving **${students.length} students** across **${metrics?.totalClasses || 0} classes**, with **${avgAttendance.toFixed(
        1
      )}%** average attendance and **${atRiskCount} students** flagged at risk.
      - **Key Concern:** ${atRiskCount > 0 ? 'At-risk students are clustering in a few classes, stressing support resources.' : 'Attendance and behavior remain steady.'}
      - **Next Step:** Coordinate targeted interventions for the cohorts and classes serving those at-risk students.
      - **Next Step:** Review session pacing in low-attendance time slots to keep the calendar full and engagement high.
    `;

    return generateAIContent(prompt, fallback);
};

export const generateTeacherListInsights = async (teachers: Teacher[], classes: ClassGroup[]): Promise<string> => {
    const prompt = `
      Analyze this teacher roster and how it maps to the current class count.
      Mention how subject coverage aligns with the class load and identify any observable gaps.
      Provide a short paragraph summary followed by at least one actionable next step for leadership, and prefix action lines with "- **Next Step:**".
      **Total Teachers:** ${teachers.length}
      **Subject List:** ${[...new Set(teachers.map(t => t.subject))].join(', ')}
      **Total Classes:** ${classes.length}
    `;
    const fallback = `Teacher distribution covers the core subject mix and ${classes.length} classes. - **Next Step:** Review whether science and mathematics classes need more depth or tutoring support to avoid coverage gaps.`;
    return generateAIContent(prompt, fallback);
};

export const generateStudentListInsights = async (students: Student[]): Promise<string> => {
    const atRisk = students.filter(s => s.atRisk).length;
    const averageAttendance = students.length
      ? students.reduce((acc, s) => acc + s.attendance, 0) / students.length
      : 0;
    const prompt = `
      Analyze this student data and provide:
      1. A short narrative about retention pressure or risk dynamics.
      2. At least one action item prefixed with "- **Next Step:**" that HQ can take to reduce risk or support attendance.
      **Total Students:** ${students.length}
      **At Risk Count:** ${atRisk}
      **Average Attendance:** ${averageAttendance.toFixed(1)}%
    `;
    const fallback = `
      ${atRisk} students are currently flagged at risk and attendance averages **${averageAttendance.toFixed(1)}%**.
      - **Next Step:** Prioritize check-ins for at-risk cohorts and re-engage families with low attendance trends.
    `;
    return generateAIContent(prompt, fallback);
};

export const generateClassListInsights = async (classes: ClassGroup[], sessions: Session[]): Promise<string> => {
    const prompt = `
      Review class and session data to describe how schedules are distributed across instructors and locations.
      Mention any observable scheduling pressure, and provide at least one specific next step prefixed with "- **Next Step:**" that would improve distribution or attendance.
      **Total Classes:** ${classes.length}
      **Total Sessions Scheduled:** ${sessions.length}
    `;
    const fallback = `Class schedules appear balanced, but keep an eye on capacity near peak hours. - **Next Step:** Audit under-attended time slots and realign instructors to maintain steady attendance.`;
    return generateAIContent(prompt, fallback);
};

export const generateStudentInsights = async (
  student: Student,
  scores: Score[],
  behaviors: BehaviorRating[]
): Promise<Insight[]> => {
  const quizScores = scores.filter((score) => score.type === 'QUIZ');
  const quizSummary = quizScores.length
    ? quizScores
        .map((score) => `${score.subject} ${score.value}% on ${score.date}`)
        .join('; ')
    : 'No recorded quizzes yet.';
  const recentScoreHighlights = scores
    .slice(-4)
    .map((score) => `${score.type} ${score.subject} ${score.value}% (${score.date})`)
    .join('; ');
  const behaviorSummary = behaviors.length
    ? behaviors
        .slice(-3)
        .map((behavior) => `${behavior.category}: ${behavior.rating}/5`)
        .join(', ')
    : 'No recent behavior notes.';

  const prompt = `
    Analyze the data below for ${student.name} and return ONLY a JSON array of three objects with "type" (POSITIVE, NEGATIVE, OVERALL) and "message".
    Each message should include a clear next step for the teacher or parent and reference at least one of the following: attendance, quiz performance, or recent behaviors.

    Student: ${student.name}
    Attendance: ${student.attendance}%
    Quiz Summary: ${quizSummary}
    Recent Scores: ${recentScoreHighlights || 'No recent scores.'}
    Behavior Highlights: ${behaviorSummary}
  `;

  try {
    const raw = await generateWithFallbackModel(prompt, {
      responseMimeType: "application/json",
      config: DEFAULT_CONFIG,
    });
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { type: string; message: string }[];
        return parsed.map((item) => ({
          studentId: student.id,
          type: item.type as 'POSITIVE' | 'NEGATIVE' | 'OVERALL',
          message: item.message,
          date: new Date().toISOString(),
        }));
      } catch (parseErr) {
        console.error("AI response parsing failed; using simulation instead", parseErr);
      }
    } else {
      console.warn("No AI response; using simulation instead");
    }
  } catch (error) {
    console.error("AI Generation failed, falling back to simulation", error);
  }

  return simulateInsights(student, scores, quizScores);
};

const simulateInsights = (student: Student, scores: Score[], quizScores: Score[]): Insight[] => {
  const insights: Insight[] = [];
  const sortedScores = scores
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const avg = scores.length ? scores.reduce((sum, score) => sum + score.value, 0) / scores.length : 0;
  const attendance = student.attendance;
  const quizAverage = quizScores.length
    ? quizScores.reduce((sum, score) => sum + score.value, 0) / quizScores.length
    : null;
  const trend = sortedScores.length > 1 ? sortedScores[sortedScores.length - 1].value - sortedScores[0].value : 0;

  let positiveMessage = `Consistent effort is visible; Next Step: highlight one strong topic and extend it with an enrichment task.`;
  if (quizAverage !== null && quizAverage >= 80) {
    positiveMessage = `Quiz average of ${quizAverage.toFixed(1)}% shows mastery; Next Step: invite the student to lead a peer review session.`;
  } else if (trend > 3) {
    positiveMessage = `Scores improved by ${trend.toFixed(1)} points; Next Step: reinforce momentum with new challenges.`;
  }

  insights.push({
    studentId: student.id,
    type: 'POSITIVE',
    message: positiveMessage,
    date: new Date().toISOString(),
  });

  let negativeMessage = `Next Step: continue watching engagement and offer a check-in if signs of slippage appear.`;
  if (attendance < 85) {
    negativeMessage = `Attendance at ${attendance}% is under target; Next Step: coordinate a parent conversation to restore consistency.`;
  } else if (avg < 70) {
    negativeMessage = `Average score ${avg.toFixed(1)}% needs pickup; Next Step: schedule a focused remediation session.`;
  } else if (quizAverage !== null && quizAverage < 70) {
    negativeMessage = `Quiz average ${quizAverage.toFixed(1)}% is below expectations; Next Step: assign targeted practice quizzes.`;
  }

  insights.push({
    studentId: student.id,
    type: 'NEGATIVE',
    message: negativeMessage,
    date: new Date().toISOString(),
  });

  insights.push({
    studentId: student.id,
    type: 'OVERALL',
    message: `Overall performance is ${avg >= 75 ? 'strong' : 'progressing steadily'}. Next Step: ${avg >= 75 ? 'continue with stretch goals.' : 'reinforce foundational topics before the next assessment.'}`,
    date: new Date().toISOString(),
  });

  return insights;
};
