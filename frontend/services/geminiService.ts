import { GoogleGenAI } from "@google/genai";
import { Insight, Student, Score, BehaviorRating, Teacher, ClassGroup, Session } from "../types";

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// General helper for generating content
const generateAIContent = async (prompt: string, fallbackMessage: string) => {
    if (!API_KEY) return fallbackMessage;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
        });
        return response.text || fallbackMessage;
    } catch (error) {
        console.error("AI Error:", error);
        return fallbackMessage;
    }
};

export const generateDashboardInsights = async (
    students: Student[],
    metrics?: {
        actualAvgAttendance?: number;
        totalSessions?: number;
        completedSessions?: number;
        totalLocations?: number;
        totalClasses?: number;
    }
): Promise<string> => {
    const atRiskCount = students.filter(s => s.atRisk).length;
    const avgAttendance = metrics?.actualAvgAttendance ??
        (students.reduce((acc, s) => acc + s.attendance, 0) / (students.length || 1));

    const prompt = `
      Analyze the institution's health based on this data:

      **Student Metrics:**
      - Total Students: ${students.length}
      - At Risk Students: ${atRiskCount} (${((atRiskCount / students.length) * 100).toFixed(1)}%)
      - Average Attendance: ${avgAttendance.toFixed(1)}%

      **Operational Metrics:**
      - Total Locations: ${metrics?.totalLocations || 'N/A'}
      - Total Classes: ${metrics?.totalClasses || 'N/A'}
      - Total Sessions: ${metrics?.totalSessions || 'N/A'}
      - Completed Sessions: ${metrics?.completedSessions || 'N/A'}

      Provide a concise executive summary (2-3 sentences) focusing on:
      1. Overall institutional health
      2. Key areas needing attention
      3. One actionable recommendation

      Format the response using Markdown: use **bold** for key metrics or importance, and use bullet points for listing specific issues or recommendations.
    `;

    const fallback = `**Institution Overview:** Currently serving **${students.length} students** across **${metrics?.totalClasses || 0} classes**. Average attendance is **${avgAttendance.toFixed(1)}%** with **${atRiskCount} students** flagged at risk. ${atRiskCount > 0 ? '**Recommendation:** Focus on early intervention programs for at-risk students.' : 'Performance is stable.'}`;

    return generateAIContent(prompt, fallback);
};

export const generateTeacherListInsights = async (teachers: Teacher[], classes: ClassGroup[]): Promise<string> => {
    const prompt = `
      Analyze this teacher data:
      Total Teachers: ${teachers.length}
      Subjects: ${[...new Set(teachers.map(t => t.subject))].join(', ')}
      Total Classes: ${classes.length}
      Provide a brief insight on staffing or subject coverage.
    `;
    return generateAIContent(prompt, "Teacher distribution covers core subjects well. Consider analyzing student-to-teacher ratios in Science classes for optimization.");
};

export const generateStudentListInsights = async (students: Student[]): Promise<string> => {
    const atRisk = students.filter(s => s.atRisk).length;
    const prompt = `
      Analyze this student data:
      Total: ${students.length}
      At Risk Count: ${atRisk}
      Avg Attendance: ${students.reduce((acc, s) => acc + s.attendance, 0) / (students.length || 1)}%
      Provide a brief insight on student retention and risk factors.
    `;
    return generateAIContent(prompt, `Currently ${atRisk} students are flagged at risk. Attendance patterns suggest a correlation between low engagement and risk status.`);
};

export const generateClassListInsights = async (classes: ClassGroup[], sessions: Session[]): Promise<string> => {
    const prompt = `
      Analyze this class data:
      Total Classes: ${classes.length}
      Total Sessions Scheduled: ${sessions.length}
      Provide a brief insight on scheduling efficiency or class distribution.
    `;
    return generateAIContent(prompt, "Class schedules are well-distributed across the week. Monitor morning sessions for higher attendance variability.");
};

export const generateStudentInsights = async (
  student: Student,
  scores: Score[],
  behaviors: BehaviorRating[]
): Promise<Insight[]> => {
  if (!API_KEY) {
    return simulateInsights(student, scores);
  }

  const prompt = `
    Analyze the following student data and provide 3 brief insights (Positive, Negative, Overall).
    Return ONLY a valid JSON array of objects with keys: "type" (one of "POSITIVE", "NEGATIVE", "OVERALL") and "message".
    
    Student: ${student.name}
    Attendance: ${student.attendance}%
    Scores (last 4 weeks): ${scores.map(s => `${s.date}: ${s.value}`).join(', ')}
    Recent Behaviors: ${behaviors.slice(0, 5).map(b => `${b.category}: ${b.rating}/5`).join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const insights = JSON.parse(text) as { type: string, message: string }[];
    
    return insights.map(i => ({
      studentId: student.id,
      type: i.type as 'POSITIVE' | 'NEGATIVE' | 'OVERALL',
      message: i.message,
      date: new Date().toISOString()
    }));

  } catch (error) {
    console.error("AI Generation failed, falling back to simulation", error);
    return simulateInsights(student, scores);
  }
};

const simulateInsights = (student: Student, scores: Score[]): Insight[] => {
  const insights: Insight[] = [];
  
  // Simulation Logic
  const recentScores = scores.map(s => s.value);
  const avg = recentScores.reduce((a, b) => a + b, 0) / (recentScores.length || 1);
  const trend = recentScores.length > 1 ? recentScores[recentScores.length - 1] - recentScores[0] : 0;

  if (trend > 5) {
    insights.push({
      studentId: student.id,
      type: 'POSITIVE',
      message: 'Showing consistent improvement in exam scores over the last month.',
      date: new Date().toISOString()
    });
  }

  if (student.attendance < 80) {
    insights.push({
      studentId: student.id,
      type: 'NEGATIVE',
      message: 'Attendance has dropped below 80%, impacting consistency.',
      date: new Date().toISOString()
    });
  } else if (avg < 60) {
    insights.push({
      studentId: student.id,
      type: 'NEGATIVE',
      message: 'Average score is critical. Remedial sessions recommended.',
      date: new Date().toISOString()
    });
  }

  insights.push({
    studentId: student.id,
    type: 'OVERALL',
    message: `Overall performance is ${avg > 75 ? 'solid' : 'needs improvement'}. ${trend > 0 ? 'Upward' : 'Stable'} trajectory observed.`,
    date: new Date().toISOString()
  });

  return insights;
};