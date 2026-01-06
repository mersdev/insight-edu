import { jsonResponse } from './utils/response.js';
import { handleLogin, handleAuthMe, handleChangePassword } from './handlers/auth.js';
import { handleGetSettings, handleUpdateSettings } from './handlers/settings.js';
import { handleGetUsers, handleUpdateUser, handleDeleteUser } from './handlers/users.js';
import { handleGetLocations, handleCreateLocation, handleGetLocation, handleUpdateLocation, handleDeleteLocation } from './handlers/locations.js';
import { handleGetTeachers, handleCreateTeacher, handleGetTeacher, handleUpdateTeacher, handleDeleteTeacher } from './handlers/teachers.js';
import { handleGetClasses, handleCreateClass, handleGetClass, handleUpdateClass, handleDeleteClass } from './handlers/classes.js';
import { handleGetStudents, handleCreateStudent, handleUpdateStudent, handleDeleteStudent } from './handlers/students.js';
import { handleGetSessions, handleCreateSession, handleGetSession, handleUpdateSession, handleUpdateSessionStatus, handleDeleteSession } from './handlers/sessions.js';
import { handleGetAttendance, handleCreateAttendance } from './handlers/attendance.js';
import { handleGetScores, handleCreateScore } from './handlers/scores.js';
import { handleGetBehaviors, handleCreateBehavior, handleUpdateBehavior, handleDeleteBehavior } from './handlers/behaviors.js';
import { handleGetRatingCategories, handleCreateRatingCategory, handleUpdateRatingCategory, handleDeleteRatingCategory } from './handlers/ratingCategories.js';
import { handleGetStudentInsight, handleSaveStudentInsight } from './handlers/studentInsights.js';
import { handleRunScheduler, handleDeleteSessionsByMonth, performScheduledMaintenance } from './handlers/scheduler.js';

const API_PREFIX = '/api/v1';
const ADMIN_PREFIX = `${API_PREFIX}/admin`;
const TEACHER_PREFIX = `${API_PREFIX}/teacher`;

export const PUBLIC_ROUTES = new Map([
  [`POST ${API_PREFIX}/auth/login`, handleLogin],
  [`GET ${API_PREFIX}/health`, ({ corsHeaders }) => jsonResponse({ status: 'ok', message: 'Server is running' }, 200, corsHeaders)],
  ['GET /health', ({ corsHeaders }) => jsonResponse({ status: 'ok', message: 'Server is running' }, 200, corsHeaders)],
]);

export const AUTH_ROUTES = new Map([
  [`GET ${API_PREFIX}/auth/me`, handleAuthMe],
  [`POST ${API_PREFIX}/auth/change-password`, handleChangePassword],
  [`GET ${ADMIN_PREFIX}/settings`, handleGetSettings],
  [`PUT ${ADMIN_PREFIX}/settings`, handleUpdateSettings],
  [`GET ${ADMIN_PREFIX}/users`, handleGetUsers],
  [`GET ${ADMIN_PREFIX}/locations`, handleGetLocations],
  [`POST ${ADMIN_PREFIX}/locations`, handleCreateLocation],
  [`GET ${ADMIN_PREFIX}/teachers`, handleGetTeachers],
  [`POST ${ADMIN_PREFIX}/teachers`, handleCreateTeacher],
  [`GET ${ADMIN_PREFIX}/classes`, handleGetClasses],
  [`POST ${ADMIN_PREFIX}/classes`, handleCreateClass],
  [`GET ${ADMIN_PREFIX}/students`, handleGetStudents],
  [`POST ${ADMIN_PREFIX}/students`, handleCreateStudent],
  [`GET ${ADMIN_PREFIX}/sessions`, handleGetSessions],
  [`POST ${ADMIN_PREFIX}/sessions`, handleCreateSession],
  [`POST ${ADMIN_PREFIX}/sessions/schedule`, handleRunScheduler],
  [`DELETE ${ADMIN_PREFIX}/sessions/by-month`, handleDeleteSessionsByMonth],
  [`POST ${ADMIN_PREFIX}/scheduled-run`, async ({ db, corsHeaders }) => {
    const result = await performScheduledMaintenance({ db });
    return jsonResponse(result, 200, corsHeaders);
  }],
  [`GET ${TEACHER_PREFIX}/sessions`, handleGetSessions],
  [`POST ${TEACHER_PREFIX}/sessions`, handleCreateSession],
  [`GET ${TEACHER_PREFIX}/attendance`, handleGetAttendance],
  [`POST ${TEACHER_PREFIX}/attendance`, handleCreateAttendance],
  [`GET ${TEACHER_PREFIX}/scores`, handleGetScores],
  [`POST ${TEACHER_PREFIX}/scores`, handleCreateScore],
  [`GET ${ADMIN_PREFIX}/behaviors`, handleGetBehaviors],
  [`POST ${ADMIN_PREFIX}/behaviors`, handleCreateBehavior],
  [`GET ${TEACHER_PREFIX}/behaviors`, handleGetBehaviors],
  [`POST ${TEACHER_PREFIX}/behaviors`, handleCreateBehavior],
  [`GET ${ADMIN_PREFIX}/rating-categories`, handleGetRatingCategories],
  [`POST ${ADMIN_PREFIX}/rating-categories`, handleCreateRatingCategory],
  [`GET ${TEACHER_PREFIX}/rating-categories`, handleGetRatingCategories],
  [`POST ${TEACHER_PREFIX}/student-insights`, handleSaveStudentInsight],
]);

const PARAM_ROUTES = [
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/users/([^/]+)$`), handler: handleUpdateUser },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/users/([^/]+)$`), handler: handleDeleteUser },
  { method: 'GET', pattern: new RegExp(`^${ADMIN_PREFIX}/locations/([^/]+)$`), handler: handleGetLocation },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/locations/([^/]+)$`), handler: handleUpdateLocation },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/locations/([^/]+)$`), handler: handleDeleteLocation },
  { method: 'GET', pattern: new RegExp(`^${ADMIN_PREFIX}/teachers/([^/]+)$`), handler: handleGetTeacher },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/teachers/([^/]+)$`), handler: handleUpdateTeacher },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/teachers/([^/]+)$`), handler: handleDeleteTeacher },
  { method: 'GET', pattern: new RegExp(`^${ADMIN_PREFIX}/classes/([^/]+)$`), handler: handleGetClass },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/classes/([^/]+)$`), handler: handleUpdateClass },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/classes/([^/]+)$`), handler: handleDeleteClass },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/students/([^/]+)$`), handler: handleUpdateStudent },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/students/([^/]+)$`), handler: handleDeleteStudent },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/behaviors/([^/]+)$`), handler: handleUpdateBehavior },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/behaviors/([^/]+)$`), handler: handleDeleteBehavior },
  { method: 'GET', pattern: new RegExp(`^${ADMIN_PREFIX}/sessions/([^/]+)$`), handler: handleGetSession },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/sessions/([^/]+)$`), handler: handleUpdateSession },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/sessions/([^/]+)/status$`), handler: handleUpdateSessionStatus },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/sessions/([^/]+)$`), handler: handleDeleteSession },
  { method: 'GET', pattern: new RegExp(`^${TEACHER_PREFIX}/sessions/([^/]+)$`), handler: handleGetSession },
  { method: 'PUT', pattern: new RegExp(`^${TEACHER_PREFIX}/sessions/([^/]+)$`), handler: handleUpdateSession },
  { method: 'PUT', pattern: new RegExp(`^${TEACHER_PREFIX}/sessions/([^/]+)/status$`), handler: handleUpdateSessionStatus },
  { method: 'DELETE', pattern: new RegExp(`^${TEACHER_PREFIX}/sessions/([^/]+)$`), handler: handleDeleteSession },
  { method: 'GET', pattern: new RegExp(`^${TEACHER_PREFIX}/student-insights/([^/]+)$`), handler: handleGetStudentInsight },
  { method: 'GET', pattern: new RegExp(`^${ADMIN_PREFIX}/student-insights/([^/]+)$`), handler: handleGetStudentInsight },
  { method: 'PUT', pattern: new RegExp(`^${ADMIN_PREFIX}/rating-categories/([^/]+)$`), handler: handleUpdateRatingCategory },
  { method: 'DELETE', pattern: new RegExp(`^${ADMIN_PREFIX}/rating-categories/([^/]+)$`), handler: handleDeleteRatingCategory },
];

export function getRouteKey(method, pathname) {
  return `${method} ${pathname}`;
}

export async function resolveParamRoute(method, pathname, context) {
  for (const route of PARAM_ROUTES) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const params = { id: match[1] };
      return route.handler({ ...context, params });
    }
  }
  return null;
}
