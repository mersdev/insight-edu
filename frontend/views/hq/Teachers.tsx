
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, Plus, Edit3, Mail, BookOpen, Search, ArrowUpDown, UserCheck, UserX, Sparkles } from 'lucide-react';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, cn } from '../../components/ui';
import { Teacher, ClassGroup, User } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomMalaysianName, getRandomItem, malaysianSubjects, malaysianPhoneNumbers, generateEmailFromName } from '../../utils/malaysianSampleData';
import { buildLoginWhatsAppMessage, buildWhatsAppLink, openWhatsAppLink } from '../../utils/whatsapp';

type SubjectLevelPair = { subject: string; levels: string[] };

interface TeachersProps {
  t: any;
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  classes: ClassGroup[];
}

const SUBJECT_DROPDOWN_OPTIONS = [
  'Bahasa Melayu',
  'English',
  'Mathematics',
  'Science',
  'History',
  'Islam / Moral',
  'Physical and Health',
  'Art',
  'Chinese',
  'Tamil',
  'ICT and Technology',
  'Biology',
  'Chemistry',
  'Physics',
  'Additional Mathematics',
  'Geography',
  'Account',
  'Economics',
] as const;

const PRIMARY_LEVEL_OPTIONS = Array.from({ length: 6 }, (_, index) => `Standard ${index + 1}`);
const SECONDARY_LEVEL_OPTIONS = Array.from({ length: 6 }, (_, index) => `Form ${index + 1}`);
const LEVEL_DROPDOWN_OPTIONS = [...PRIMARY_LEVEL_OPTIONS, ...SECONDARY_LEVEL_OPTIONS] as const;

const resolveTeacherSubjects = (teacher: Teacher) => {
  const subjectsFromSubjectLevels =
    (teacher.subjectLevels || []).map((entry) => entry.subject).filter(Boolean);

  const subjectsFromSubjects = (teacher.subjects || [])
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : (entry?.name || (entry as any)?.subject || '').trim()
    )
    .filter(Boolean);

  const subjectsFromSubjectNames = teacher.subjectNames || [];

  const combined = [...subjectsFromSubjectLevels, ...subjectsFromSubjectNames, ...subjectsFromSubjects];
  if (combined.length > 0) {
    return Array.from(new Set(combined));
  }

  return teacher.subject ? [teacher.subject] : [];
};

export const Teachers: React.FC<TeachersProps> = ({ t, teachers, setTeachers, classes }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({ 
    name: '', email: '', englishName: '', chineseName: '', phone: '', description: '' 
  });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevelPair[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSubjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedSubjects = useMemo(
    () => subjectLevels.map((entry) => entry.subject),
    [subjectLevels]
  );
  const pendingCustomSubject = useMemo(() => {
    const value = subjectSearch.trim();
    if (!value) return null;
    const existsInSelected = selectedSubjects.some((s) => s.toLowerCase() === value.toLowerCase());
    const existsInPresets = SUBJECT_DROPDOWN_OPTIONS.some((s) => s.toLowerCase() === value.toLowerCase());
    return existsInSelected || existsInPresets ? null : value;
  }, [subjectSearch, selectedSubjects]);
  const [levelSearch, setLevelSearch] = useState('');
  const [isLevelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement | null>(null);
  const pendingCustomLevel = useMemo(() => {
    const value = levelSearch.trim();
    if (!value || !activeSubject) return null;
    const currentLevels = subjectLevels.find((entry) => entry.subject === activeSubject)?.levels || [];
    const exists = currentLevels.some((lvl) => lvl.toLowerCase() === value.toLowerCase()) ||
      LEVEL_DROPDOWN_OPTIONS.some((lvl) => lvl.toLowerCase() === value.toLowerCase());
    return exists ? null : value;
  }, [levelSearch, activeSubject, subjectLevels]);
  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const filteredSubjectOptions = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    const baseOptions = query
      ? SUBJECT_DROPDOWN_OPTIONS.filter((subject) => subject.toLowerCase().includes(query))
      : SUBJECT_DROPDOWN_OPTIONS;
    const customOption = subjectSearch.trim();
    if (customOption && !baseOptions.some((option) => option.toLowerCase() === customOption.toLowerCase())) {
      return [customOption, ...baseOptions];
    }
    return baseOptions;
  }, [subjectSearch]);

  const filteredLevelOptions = useMemo(() => {
    const query = levelSearch.trim().toLowerCase();
    const customOption = levelSearch.trim();
    const options = customOption
      ? [customOption, ...LEVEL_DROPDOWN_OPTIONS]
      : LEVEL_DROPDOWN_OPTIONS;
    const uniqueOptions = Array.from(new Set(options));
    return query
      ? uniqueOptions.filter((level) => level.toLowerCase().includes(query))
      : uniqueOptions;
  }, [levelSearch]);

  useEffect(() => {
     const fetchUsers = async () => {
         try {
             const u = await api.fetchUsers();
             setUsers(u);
         } catch (error) {
             console.error('Failed to fetch users:', error);
         }
     };
     fetchUsers();
  }, [teachers]);

  // Derive unique subjects for filter
  const subjects = useMemo(() => {
    const unique = new Map<string, string>();
    teachers.forEach((teacher) => {
      resolveTeacherSubjects(teacher).forEach((subject) => {
        const key = subject.toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, subject);
        }
      });
    });
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setSubjectDropdownOpen(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setLevelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeSubject && subjectLevels.length > 0) {
      setActiveSubject(subjectLevels[0].subject);
    }
  }, [activeSubject, subjectLevels]);

  const handleSubjectInputChange = (value: string) => {
    setSubjectSearch(value);
    setSubjectDropdownOpen(true);
  };

  const addSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;
    setSubjectLevels((prev) => {
      const exists = prev.some((entry) => entry.subject.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev;
      }
      return [{ subject: trimmed, levels: [] }, ...prev];
    });
    setActiveSubject(trimmed);
    setSubjectSearch('');
    setSubjectDropdownOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    addSubject(subject);
  };

  const removeSubject = (subject: string) => {
    setSubjectLevels((prev) => prev.filter((item) => item.subject !== subject));
    if (activeSubject === subject) {
      setActiveSubject(null);
    }
  };

  const renameSubject = (oldSubject: string, newSubject: string) => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    setSubjectLevels((prev) => {
      const withoutOld = prev.filter((entry) => entry.subject !== oldSubject);
      const existingIndex = withoutOld.findIndex((entry) => entry.subject.toLowerCase() === trimmed.toLowerCase());
      if (existingIndex >= 0) {
        // Merge levels if the new subject already exists
        const mergedLevels = Array.from(
          new Set([...(withoutOld[existingIndex].levels || []), ...(prev.find((e) => e.subject === oldSubject)?.levels || [])])
        );
        const updated = [...withoutOld];
        updated[existingIndex] = { ...updated[existingIndex], levels: mergedLevels, subject: withoutOld[existingIndex].subject };
        return updated;
      }
      return [{ subject: trimmed, levels: prev.find((e) => e.subject === oldSubject)?.levels || [] }, ...withoutOld];
    });
    if (activeSubject === oldSubject) {
      setActiveSubject(trimmed);
    }
  };

  const handleLevelInputChange = (value: string) => {
    setLevelSearch(value);
    setLevelDropdownOpen(true);
  };

  const addLevel = (level: string, targetSubject?: string) => {
    const trimmed = level.trim();
    const subjectTarget = targetSubject || activeSubject;
    if (!trimmed || !subjectTarget) {
      setErrorDialog('Select a subject first, then add the matching Standard / Form level.');
      return;
    }
    setSubjectLevels((prev) => {
      let found = false;
      const updated = prev.map((entry) => {
        if (entry.subject === subjectTarget) {
          found = true;
          const updatedLevels = Array.from(new Set([trimmed, ...(entry.levels || [])]));
          return { ...entry, levels: updatedLevels };
        }
        return entry;
      });
      if (!found) {
        return [{ subject: subjectTarget, levels: [trimmed] }, ...updated];
      }
      return updated;
    });
    setLevelSearch('');
    setLevelDropdownOpen(false);
  };

  const handleLevelSelect = (level: string) => {
    const subjectValue = subjectSearch.trim() || activeSubject || subjectLevels[0]?.subject || '';
    addLevel(level, subjectValue || undefined);
  };

  const handleAddSubjectLevel = () => {
    const subjectValue = subjectSearch.trim() || activeSubject || subjectLevels[0]?.subject || '';
    const levelValue = levelSearch.trim();
    if (!subjectValue) {
      setErrorDialog('Add a subject to continue.');
      return;
    }
    if (!levelValue) {
      setErrorDialog('Add at least one Standard / Form level.');
      return;
    }
    setSubjectLevels((prev) => {
      const trimmedSubject = subjectValue.trim();
      const trimmedLevel = levelValue.trim();
      let found = false;
      const updated = prev.map((entry) => {
        if (entry.subject.toLowerCase() === trimmedSubject.toLowerCase()) {
          found = true;
          const mergedLevels = Array.from(new Set([trimmedLevel, ...(entry.levels || [])]));
          return { ...entry, subject: entry.subject, levels: mergedLevels };
        }
        return entry;
      });
      if (!found) {
        return [{ subject: trimmedSubject, levels: [trimmedLevel] }, ...updated];
      }
      return updated;
    });
    setActiveSubject(subjectValue);
    setSubjectSearch('');
    setLevelSearch('');
    setSubjectDropdownOpen(false);
    setLevelDropdownOpen(false);
  };

  const updateLevelsFromText = (subject: string, text: string) => {
    const parsed = text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setSubjectLevels((prev) =>
      prev.map((entry) =>
        entry.subject === subject ? { ...entry, levels: Array.from(new Set(parsed)) } : entry
      )
    );
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      const fallbackSubjects = resolveTeacherSubjects(teacher);
      const teacherSubjectLevels = (teacher.subjectLevels && teacher.subjectLevels.length > 0)
        ? teacher.subjectLevels
        : fallbackSubjects.length > 0
          ? fallbackSubjects.map((subject) => ({
              subject,
              levels: teacher.levels || [],
            }))
          : [];
      setSubjectLevels(teacherSubjectLevels);
      setActiveSubject(teacherSubjectLevels[0]?.subject || null);
      setNewTeacher({
        name: teacher.name,
        email: teacher.email,
        englishName: teacher.englishName,
        chineseName: teacher.chineseName,
        phone: teacher.phone,
        description: teacher.description,
        subject: teacherSubjectLevels[0]?.subject || teacher.subject || '',
      });
    } else {
      setEditingTeacher(null);
      setNewTeacher({ name: '', email: '', englishName: '', chineseName: '', phone: '', description: '' });
      setSubjectLevels([]);
      setActiveSubject(null);
    }
    setDialogOpen(true);
    setSubjectDropdownOpen(false);
    setLevelDropdownOpen(false);
    setSubjectSearch('');
    setLevelSearch('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSubjectDropdownOpen(false);
    setLevelDropdownOpen(false);
    setSubjectSearch('');
    setLevelSearch('');
    setSubjectLevels([]);
    setActiveSubject(null);
    setEditingTeacher(null);
    setNewTeacher({ name: '', email: '', englishName: '', chineseName: '', phone: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    // Constraint Check: Is teacher assigned to any class?
    const assignedClasses = classes.filter(c => c.teacherId === id);
    if (assignedClasses.length > 0) {
      setErrorDialog(`Cannot delete this teacher. They are currently assigned to ${assignedClasses.length} class(es). Please reassign or delete the classes first.`);
      return;
    }

    if (confirm(t.deleteTeacherConfirm)) {
      await api.deleteTeacher(id);
      setTeachers(teachers.filter(teacher => teacher.id !== id));
    }
  };

  const handleSaveTeacher = async () => {
    // Phone Validation
    const phoneRegex = /^01\d(?:[-\s]?\d){7,8}(?:\s*\/\s*01\d(?:[-\s]?\d){7,8})*$/;
    if (newTeacher.phone && !phoneRegex.test(newTeacher.phone)) {
        setErrorDialog('Phone number must start with 01X and include 7–8 digits, optionally separated by "-" or space; use "/" to add multiple numbers.');
        return;
    }

    if (!newTeacher.name || !newTeacher.email) {
      setErrorDialog(t.fillAllFields || 'Name and email are required.');
      return;
    }

    if (subjectLevels.length === 0) {
      setErrorDialog('Please add at least one subject for the teacher.');
      return;
    }

    const hasEmptyLevel = subjectLevels.some((entry) => !entry.levels || entry.levels.length === 0);
    if (hasEmptyLevel) {
      setErrorDialog('Add at least one Standard / Form level for each subject.');
      return;
    }

    const flattenedSubjects = subjectLevels.map((entry) => entry.subject);
    const flattenedLevels = Array.from(
      new Set(subjectLevels.flatMap((entry) => entry.levels || []))
    );

    const payload: Teacher = {
      id: editingTeacher?.id || `t${Date.now()}`,
      name: newTeacher.name || '',
      email: newTeacher.email || '',
      subject: flattenedSubjects[0],
      subjects: flattenedSubjects,
      subjectLevels,
      levels: flattenedLevels,
      englishName: newTeacher.englishName,
      chineseName: newTeacher.chineseName,
      phone: newTeacher.phone,
      description: newTeacher.description
    } as Teacher;

    try {
      if (editingTeacher) {
        const updated = await api.updateTeacher(payload);
        setTeachers(teachers.map((teacher) => (teacher.id === updated.id ? updated : teacher)));
      } else {
        const created = await api.createTeacher(payload);
        setTeachers([...teachers, created]);
        if (created.phone) {
          handleSendLoginWhatsApp(created);
        }
      }
      setSubjectSearch('');
      setLevelSearch('');
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save teacher', error);
      setErrorDialog('Unable to save teacher. Please try again.');
    }
  };

  const handleSendLoginWhatsApp = (teacher: Teacher) => {
    if (!teacher.phone) {
      setErrorDialog(t.whatsAppPhoneMissing || 'Add a phone number to send WhatsApp messages.');
      return;
    }

    const message = buildLoginWhatsAppMessage({
      name: teacher.name || 'Teacher',
      role: 'TEACHER',
      email: teacher.email,
    });

    const link = buildWhatsAppLink(teacher.phone, message);
    if (!link) {
      setErrorDialog(t.whatsAppPhoneMissing || 'Add a phone number to send WhatsApp messages.');
      return;
    }

    openWhatsAppLink(link);
  };

  const handleAutoFillTeacher = () => {
    const teacherName = getRandomMalaysianName();
    const subject = getRandomItem(malaysianSubjects);
    const phone = getRandomItem(malaysianPhoneNumbers);
    const email = generateEmailFromName(`${teacherName.full}.teacher`);
    const descriptions = [
      'Experienced educator with passion for teaching',
      'Dedicated teacher focused on student success',
      'Innovative instructor with modern teaching methods',
      'Patient and caring educator',
      'Results-driven teacher with proven track record',
    ];

    setNewTeacher({
      ...newTeacher,
      name: teacherName.full,
      englishName: teacherName.english,
      chineseName: teacherName.chinese,
      email: email,
      phone: phone,
      description: getRandomItem(descriptions),
    });
    setSubjectLevels([{ subject, levels: [getRandomItem(LEVEL_DROPDOWN_OPTIONS)] }]);
    setActiveSubject(subject);
    setSubjectSearch('');
    setLevelSearch('');
    setSubjectDropdownOpen(false);
    setLevelDropdownOpen(false);
  };
  
  const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const teacherSubjects = resolveTeacherSubjects(teacher);
    const searchMatches =
      teacher.name.toLowerCase().includes(normalizedSearch) ||
      teacher.email.toLowerCase().includes(normalizedSearch) ||
      teacherSubjects.some((subject) => subject.toLowerCase().includes(normalizedSearch));
    const filterMatches =
      subjectFilter === 'ALL' ||
      teacherSubjects.includes(subjectFilter);
    return searchMatches && filterMatches;
  }).sort((a, b) => {
    return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-2">
         <h1 className="text-3xl font-bold tracking-tight">{t.teachers}</h1>
         <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()}>
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
               placeholder="Search by name, email or subject..."
               className="pl-9 w-full h-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="md:col-span-4">
            <Select 
                value={subjectFilter} 
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full h-10"
            >
                <option value="ALL">All Subjects</option>
                {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </Select>
          </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                     {t.name}
                     <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
              </TableHead>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.subject}</TableHead>
              <TableHead>{t.levels || 'Standard / Form'}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => {
               const hasAccount = users.some(u => u.email === teacher.email);
               const subjectList = resolveTeacherSubjects(teacher);
               return (
                <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                         <div>
                            <div>{teacher.name}</div>
                            <div className="text-xs text-muted-foreground">{teacher.englishName} {teacher.chineseName}</div>
                         </div>
                    </div>
                    </TableCell>
                    <TableCell>
                    <div className="flex flex-col text-sm">
                        <div className="flex items-center text-muted-foreground mb-1">
                            <Mail className="w-3 h-3 mr-2" />
                            {teacher.email}
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
                      <div className="flex flex-wrap gap-1">
                        {subjectList.length > 0 ? (
                          subjectList.map((subject) => (
                            <Badge key={`subject-${subject}`} variant="outline" className="h-6 px-3 text-sm">
                              {subject}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.levels && teacher.levels.length > 0 ? (
                          teacher.levels.map((level) => (
                            <Badge key={`level-${level}`} variant="secondary" className="h-6 px-3 text-sm">
                              {level}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(teacher)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(teacher.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    </TableCell>
                </TableRow>
               );
            })}
            {filteredTeachers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">{t.noData}</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        title={t.addNewTeacher}
        disableOverlayClose
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleAutoFillTeacher}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t.autoFill}
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleSaveTeacher}>{editingTeacher ? 'Update' : t.save}</Button>
              <Button variant="outline" onClick={handleCloseDialog}>{t.cancel}</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 max-h-[70vh] overflow-y-auto pr-2">
           <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium mb-1">{t.fullName} *</label>
             <Input 
                value={newTeacher.name} 
                onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} 
                placeholder={t.fullNamePlaceholder} 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.englishName} *</label>
             <Input 
                value={newTeacher.englishName} 
                onChange={(e) => setNewTeacher({...newTeacher, englishName: e.target.value})} 
                placeholder={t.englishNamePlaceholder} 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-medium mb-1">{t.chineseName} (Optional)</label>
             <Input 
                value={newTeacher.chineseName} 
                onChange={(e) => setNewTeacher({...newTeacher, chineseName: e.target.value})} 
                placeholder={t.chineseNamePlaceholder} 
             />
           </div>
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t.subject} & {t.levels} <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Add subject and level together in one step. Custom entries are supported; suggestions appear as you type.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div
                className="md:col-span-5 space-y-1 relative"
                ref={subjectDropdownRef}
                data-cy="teacher-subject-field"
              >
                <Input 
                  value={subjectSearch} 
                  onChange={(e) => handleSubjectInputChange(e.target.value)} 
                  placeholder={t.subjectPlaceholder} 
                  autoComplete="off"
                  onFocus={() => setSubjectDropdownOpen(true)}
                  onClick={() => setSubjectDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubjectLevel();
                    }
                  }}
                  data-cy="teacher-subject-input"
                />
                <div
                  className={cn(
                    'absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-lg',
                    isSubjectDropdownOpen ? 'block' : 'hidden'
                  )}
                >
                  {pendingCustomSubject && (
                    <div className="border-b border-border/60 bg-muted/30">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                        onClick={() => handleSubjectSelect(pendingCustomSubject)}
                      >
                        Add "{pendingCustomSubject}"
                      </button>
                    </div>
                  )}
                  {filteredSubjectOptions.filter(option => !selectedSubjects.includes(option)).length > 0 ? (
                    filteredSubjectOptions
                      .filter(option => !selectedSubjects.includes(option))
                      .map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          data-cy="subject-dropdown-option"
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                          onClick={() => handleSubjectSelect(subject)}
                        >
                          {subject}
                        </button>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No subjects found.</div>
                  )}
                </div>
              </div>
              <div
                className="md:col-span-5 space-y-1 relative"
                ref={levelDropdownRef}
                data-cy="teacher-level-field"
              >
                <Input
                  value={levelSearch}
                  onChange={(e) => handleLevelInputChange(e.target.value)}
                  placeholder="e.g. Standard 1 or Form 1"
                  autoComplete="off"
                  onFocus={() => setLevelDropdownOpen(true)}
                  onClick={() => setLevelDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubjectLevel();
                    }
                  }}
                  data-cy="teacher-level-input"
                />
                <div
                  className={cn(
                    'absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-lg',
                    isLevelDropdownOpen ? 'block' : 'hidden'
                  )}
                >
                  {pendingCustomLevel && (
                    <div className="border-b border-border/60 bg-muted/30">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                        onClick={() => handleLevelSelect(pendingCustomLevel)}
                      >
                        Add "{pendingCustomLevel}"
                      </button>
                    </div>
                  )}
                  {filteredLevelOptions.filter(option => !(subjectLevels.find((entry) => entry.subject === activeSubject)?.levels || []).includes(option)).length > 0 ? (
                    filteredLevelOptions
                      .filter(option => {
                        const currentLevels = subjectLevels.find((entry) => entry.subject === activeSubject)?.levels || [];
                        return !currentLevels.includes(option);
                      })
                      .map(level => (
                        <button
                          key={level}
                          type="button"
                          data-cy="level-dropdown-option"
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                          onClick={() => handleLevelSelect(level)}
                        >
                          {level}
                        </button>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No levels found.</div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center">
                <Button className="w-full" onClick={handleAddSubjectLevel}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-cy="subject-level-list">
              {subjectLevels.length === 0 && (
                <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-3">
                  Add a subject and level to build the tutor&apos;s loadout.
                </div>
              )}
              {subjectLevels.map((entry) => {
                const isActive = activeSubject === entry.subject;
                return (
                  <div
                    key={`subject-row-${entry.subject}`}
                    className={cn(
                      'border rounded-lg p-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 bg-white',
                      isActive && 'border-primary/60 shadow-sm bg-primary/5'
                    )}
                    onClick={() => setActiveSubject(entry.subject)}
                  >
                    <Input
                      className="flex-1"
                      value={entry.subject}
                      onChange={(e) => renameSubject(entry.subject, e.target.value)}
                      onFocus={() => setActiveSubject(entry.subject)}
                      placeholder={t.subjectPlaceholder}
                    />
                    <Input
                      className="flex-1"
                      value={(entry.levels || []).join(', ')}
                      onChange={(e) => updateLevelsFromText(entry.subject, e.target.value)}
                      onFocus={() => setActiveSubject(entry.subject)}
                      placeholder="e.g. Standard 1 or Form 1"
                    />
                    <Button
                      className="bg-destructive text-white hover:bg-destructive/90 md:ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSubject(entry.subject);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium mb-1">{t.email} *</label>
             <Input 
                value={newTeacher.email} 
                onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} 
                placeholder={t.emailPlaceholder_teacher} 
                type="email"
             />
             <p className="text-xs text-muted-foreground mt-1">{t.userCreated}</p>
           </div>
           <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium mb-1">{t.phone} *</label>
             <Input 
                value={newTeacher.phone} 
                onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} 
                placeholder="01X-XXXXXXX" 
             />
             <p className="text-xs text-muted-foreground mt-1">Format: 01X-XXXXXXX or 01XXXXXXXX</p>
           </div>
           <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium mb-1">{t.description} (Optional)</label>
             <Input 
                value={newTeacher.description} 
                onChange={(e) => setNewTeacher({...newTeacher, description: e.target.value})} 
                placeholder={t.descPlaceholder} 
             />
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
