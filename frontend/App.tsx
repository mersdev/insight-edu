
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, Teacher, ClassGroup, Student, Score, BehaviorRating, Session, AttendanceRecord, Location, RatingCategory } from './types';
import { TRANSLATIONS } from './constants';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { Login } from './views/Login';
import { ChangePassword } from './views/ChangePassword';
import { cn, Dialog, Button } from './components/ui';
import { api } from './services/backendApi';

// Views
import { HQDashboard } from './views/hq/Dashboard';
import { Teachers } from './views/hq/Teachers';
import { Students } from './views/hq/Students';
import { Classes } from './views/hq/Classes';
import { Locations } from './views/hq/Locations';
import { SettingsPage } from './views/hq/Settings';
import { ScoreInput } from './views/teacher/ScoreInput';
import { TeacherClasses } from './views/teacher/Classes'; // New Import
import { StudentReport } from './views/shared/StudentReport';

// Auth Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, user: User | null, redirectPath?: string }> = ({ children, user, redirectPath = "/login" }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Global Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorRating[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>([]);

  // Teacher View State
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Device Warning State
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const isTestEnv = typeof window !== 'undefined' && !!(window as any).Cypress;

  const getStoredDeviceWarningDismissed = (role?: string | null) => {
    if (typeof window === 'undefined') return false;
    if (isTestEnv) return true;
    const key = role ? `deviceWarningDismissed_${role}` : 'deviceWarningDismissed';
    return window.localStorage.getItem(key) === 'true';
  };

  const [deviceWarningMsg, setDeviceWarningMsg] = useState('');
  const [deviceWarningDismissed, setDeviceWarningDismissed] = useState(() =>
    getStoredDeviceWarningDismissed(null)
  );

  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();
  const location = useLocation();

  const refreshRatingCategories = useCallback(async () => {
    try {
      const categories = await api.fetchRatingCategories();
      setRatingCategories(categories);
      return categories;
    } catch (error) {
      console.error('Failed to fetch rating categories:', error);
      return [];
    }
  }, []);

  // Restore session on app initialization
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = api.getStoredSession();
        if (storedSession) {
          // Verify the token is still valid
          const currentUser = await api.verifyToken();
          if (currentUser) {
            setUser({
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role as 'HQ' | 'TEACHER' | 'PARENT',
            });
            setMustChangePassword(currentUser.mustChangePassword || false);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, []);

  // Fetch Initial Data (only when authenticated and not changing password)
  useEffect(() => {
    if (!user || mustChangePassword) return;

    const initData = async () => {
        try {
          await api.init();

          const [t, c, s, sess, att, sc, beh, loc] = await Promise.all([
              api.fetchTeachers(),
              api.fetchClasses(),
              api.fetchStudents(),
              api.fetchSessions(),
              api.fetchAttendance(),
              api.fetchScores(),
              api.fetchBehaviors(),
              api.fetchLocations()
          ]);
          setTeachers(t);
          setClasses(c);
          setStudents(s);
          setSessions(sess);
          setAttendance(att);
          setScores(sc);
          setBehaviors(beh);
          setLocations(loc);
          await refreshRatingCategories();
          // Use backend sessions as-is (no auto-generation)
          setSessions(sess);
        } catch (error) {
          console.error('Failed to fetch data:', error);
          // If unauthorized, logout
          if (error instanceof Error && error.message.includes('Unauthorized')) {
            handleLogout();
          }
        }
    };
    initData();
  }, [user, mustChangePassword, refreshRatingCategories]);

  // Filter Classes for Teacher (Match by Email as UserID might differ from TeacherID)
  const teacherClasses = useMemo(() => {
    if (!user || user.role !== 'TEACHER') return [];
    // Defensive check: ensure teachers and classes are arrays
    const safeTeachers = Array.isArray(teachers) ? teachers : [];
    const safeClasses = Array.isArray(classes) ? classes : [];
    const teacher = safeTeachers.find(t => t.email === user.email);
    return teacher ? safeClasses.filter(c => c.teacherId === teacher.id) : [];
  }, [user, teachers, classes]);

  const currentTeacher = useMemo(() => {
    if (!user || user.role !== 'TEACHER') return null;
    const safeTeachers = Array.isArray(teachers) ? teachers : [];
    return safeTeachers.find(t => t.email === user.email) || null;
  }, [user, teachers]);

  // Auto-select class logic
  useEffect(() => {
    const availableClasses = user?.role === 'TEACHER' ? teacherClasses : classes;
    // Defensive check: ensure availableClasses is an array
    const safeAvailableClasses = Array.isArray(availableClasses) ? availableClasses : [];
    const selectedClassExists = safeAvailableClasses.some(c => c.id === selectedClassId);

    if (safeAvailableClasses.length > 0) {
      if (!selectedClassId || !selectedClassExists) {
        setSelectedClassId(safeAvailableClasses[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [classes, teacherClasses, selectedClassId, user]);

  // Device Warning Logic
  useEffect(() => {
    if (isTestEnv) {
      setShowDeviceWarning(false);
      setDeviceWarningDismissed(true);
      return;
    }

    const nextDismissed = getStoredDeviceWarningDismissed(user?.role);
    setDeviceWarningDismissed(nextDismissed);
  }, [user, isTestEnv]);

  useEffect(() => {
    if (!user || deviceWarningDismissed || isTestEnv) {
        setShowDeviceWarning(false);
        return;
    }

    const checkDevice = () => {
        const width = window.innerWidth;
        const isMobile = width < 768; // md breakpoint

        if (user.role === 'HQ' && isMobile) {
            setDeviceWarningMsg(t.recommendDesktop);
            setShowDeviceWarning(true);
        } else if ((user.role === 'TEACHER' || user.role === 'PARENT') && !isMobile) {
            setDeviceWarningMsg(t.recommendMobile);
            setShowDeviceWarning(true);
        } else {
            setShowDeviceWarning(false);
        }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [user, t, deviceWarningDismissed]);

  const handleDismissWarning = () => {
    setShowDeviceWarning(false);
    setDeviceWarningDismissed(true);

    if (typeof window !== 'undefined' && !isTestEnv) {
      const key = user?.role ? `deviceWarningDismissed_${user.role}` : 'deviceWarningDismissed';
      window.localStorage.setItem(key, 'true');
    }
  };

  // Handle Login
  const handleLogin = (loggedInUser: User, requirePasswordChange: boolean) => {
    setUser(loggedInUser);
    setMustChangePassword(requirePasswordChange);

    // If password change is required, redirect to change password page
    if (requirePasswordChange) {
      navigate('/change-password');
      return;
    }

    // Otherwise, redirect based on role
    switch (loggedInUser.role) {
      case 'HQ':
        navigate('/dashboard');
        break;
      case 'TEACHER':
        navigate('/teacher/classes');
        break;
      case 'PARENT':
        navigate('/reports');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Handle Password Changed
  const handlePasswordChanged = () => {
    setMustChangePassword(false);

    // Redirect based on role after password change
    if (user) {
      switch (user.role) {
        case 'HQ':
          navigate('/dashboard');
          break;
        case 'TEACHER':
          navigate('/teacher/classes');
          break;
        case 'PARENT':
          navigate('/reports');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setMustChangePassword(false);
    navigate('/login');
  };

  // Show loading while restoring session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {user && (
        <Navigation
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
          user={user}
          lang={lang}
          toggleLang={() => setLang(l => l === 'en' ? 'zh' : 'en')}
          onLogout={handleLogout}
        />
      )}

      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden",
        user ? (isSidebarCollapsed ? "md:ml-16" : "md:ml-64") : ""
      )}>
        <div className={cn("mx-auto w-full", location.pathname === "/reports" ? "max-w-full" : "max-w-7xl")}>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={!user ? <Login onLogin={handleLogin} lang={lang} toggleLang={() => setLang(l => l === 'en' ? 'zh' : 'en')} /> : <Navigate to="/" />} />

                {/* Change Password Route */}
                <Route path="/change-password" element={
                  user && mustChangePassword ? (
                    <ChangePassword
                      onPasswordChanged={handlePasswordChanged}
                      onLogout={handleLogout}
                      userName={user.name}
                      isFirstTime={true}
                    />
                  ) : (
                    <Navigate to={user ? "/" : "/login"} />
                  )
                } />

                {/* Root Redirect */}
                <Route path="/" element={
                  user ? (
                    mustChangePassword ? (
                      <Navigate to="/change-password" />
                    ) : (
                      <Navigate to={user.role === 'HQ' ? "/dashboard" : user.role === 'TEACHER' ? "/teacher/classes" : "/reports"} />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                } />

                {/* HQ Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? <HQDashboard t={t} students={students} classes={classes} locations={locations} ratingCategories={ratingCategories} /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/teachers" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? <Teachers t={t} teachers={teachers} setTeachers={setTeachers} classes={classes} /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/students" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? <Students t={t} students={students} setStudents={setStudents} classes={classes} scores={scores} sessions={sessions} attendance={attendance} behaviors={behaviors} teachers={teachers} ratingCategories={ratingCategories} /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/classes" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? <Classes t={t} classes={classes} setClasses={setClasses} teachers={teachers} students={students} sessions={sessions} setSessions={setSessions} locations={locations} /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/locations" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? <Locations t={t} locations={locations} setLocations={setLocations} classes={classes} /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute user={user}>
                        {user?.role === 'HQ' ? (
                            <SettingsPage
                                t={t}
                                students={students}
                                sessions={sessions}
                                teachers={teachers}
                                behaviors={behaviors}
                                setBehaviors={setBehaviors}
                                ratingCategories={ratingCategories}
                                refreshRatingCategories={refreshRatingCategories}
                            />
                        ) : <Navigate to="/" />}
                    </ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="/input" element={
                    <ProtectedRoute user={user}>
                         {user?.role === 'TEACHER' ? <ScoreInput 
                            t={t} 
                            students={students} 
                         classes={teacherClasses} 
                          selectedClassId={selectedClassId}
                          onSelectClass={setSelectedClassId}
                          onShowToast={setToastMessage}
                          teacher={currentTeacher}
                         /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />
                <Route path="/teacher/classes" element={
                    <ProtectedRoute user={user}>
                         {user?.role === 'TEACHER' ? <TeacherClasses 
                            t={t} 
                            classes={teacherClasses} 
                            selectedClassId={selectedClassId}
                         onSelectClass={setSelectedClassId}
                         sessions={sessions}
                         setSessions={setSessions}
                         students={students}
                         behaviors={behaviors}
                         setBehaviors={setBehaviors}
                         attendance={attendance}
                         setAttendance={setAttendance}
                         ratingCategories={ratingCategories}
                         /> : <Navigate to="/" />}
                    </ProtectedRoute>
                } />

                {/* Shared/Parent Routes */}
                <Route path="/reports" element={
                    <ProtectedRoute user={user}>
                        <StudentReport 
                          user={user!} 
                          t={t} 
                          students={user?.role === 'PARENT' ? students.filter(s => s.parentId === user.id) : students} 
                          classes={classes} 
                          scores={scores} 
                          behaviors={behaviors}
                          sessions={sessions}
                          attendance={attendance}
                          teachers={teachers}
                          ratingCategories={ratingCategories}
                        />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
      </main>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <Dialog 
        isOpen={showDeviceWarning} 
        onClose={handleDismissWarning} 
        title={lang === 'en' ? 'Recommendation' : '建议'}
        footer={<Button onClick={handleDismissWarning}>OK</Button>}
      >
        <p className="text-muted-foreground">{deviceWarningMsg}</p>
      </Dialog>
    </div>
  );
};

// Wrapper for Router
const App: React.FC = () => {
    return (
        <HashRouter>
            <AppContent />
        </HashRouter>
    );
};

export default App;
