
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, Plus, Edit3, Mail, BookOpen, Search, ArrowUpDown, UserCheck, UserX, Sparkles } from 'lucide-react';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge, cn } from '../../components/ui';
import { Teacher, ClassGroup, User } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomMalaysianName, getRandomItem, malaysianSubjects, malaysianPhoneNumbers, generateEmailFromName } from '../../utils/malaysianSampleData';
import { buildLoginWhatsAppMessage, buildWhatsAppLink, openWhatsAppLink } from '../../utils/whatsapp';

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
  if (teacher.subjects && teacher.subjects.length > 0) {
    return teacher.subjects;
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSubjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [levelSearch, setLevelSearch] = useState('');
  const [isLevelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement | null>(null);
  const tagButtonClass =
    'inline-flex items-center gap-2 rounded-full border border-input bg-muted/10 px-3 py-2 text-sm font-medium text-foreground leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  
  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const filteredSubjectOptions = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    return query
      ? SUBJECT_DROPDOWN_OPTIONS.filter((subject) => subject.toLowerCase().includes(query))
      : SUBJECT_DROPDOWN_OPTIONS;
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
    const unique = new Set(teachers.flatMap((t) => resolveTeacherSubjects(t)));
    return Array.from(unique).sort();
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

  const handleSubjectInputChange = (value: string) => {
    setSubjectSearch(value);
    setSubjectDropdownOpen(true);
  };

  const addSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;
    setSelectedSubjects((prev) => Array.from(new Set([trimmed, ...prev])));
    setSubjectSearch('');
    setSubjectDropdownOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    addSubject(subject);
  };

  const removeSubject = (subject: string) => {
    setSelectedSubjects((prev) => prev.filter((item) => item !== subject));
  };

  const handleLevelInputChange = (value: string) => {
    setLevelSearch(value);
    setLevelDropdownOpen(true);
  };

  const addLevel = (level: string) => {
    const trimmed = level.trim();
    if (!trimmed) return;
    setSelectedLevels((prev) => Array.from(new Set([trimmed, ...prev])));
    setLevelSearch('');
    setLevelDropdownOpen(false);
  };

  const handleLevelSelect = (level: string) => {
    addLevel(level);
  };

  const removeLevel = (level: string) => {
    setSelectedLevels((prev) => prev.filter((item) => item !== level));
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      const teacherSubjects = teacher.subjects && teacher.subjects.length > 0
        ? teacher.subjects
        : teacher.subject
          ? [teacher.subject]
          : [];
      setSelectedSubjects(teacherSubjects);
      setSelectedLevels(teacher.levels || []);
      setNewTeacher({
        name: teacher.name,
        email: teacher.email,
        englishName: teacher.englishName,
        chineseName: teacher.chineseName,
        phone: teacher.phone,
        description: teacher.description,
        subject: teacherSubjects[0] || teacher.subject || '',
      });
    } else {
      setEditingTeacher(null);
      setNewTeacher({ name: '', email: '', englishName: '', chineseName: '', phone: '', description: '' });
      setSelectedSubjects([]);
      setSelectedLevels([]);
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
    setSelectedSubjects([]);
    setSelectedLevels([]);
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

    if (selectedSubjects.length === 0) {
      setErrorDialog('Please add at least one subject for the teacher.');
      return;
    }

    if (selectedLevels.length === 0) {
      setErrorDialog('Please add at least one Standard or Form entry (e.g. Standard 1 or Form 1).');
      return;
    }

    const payload: Teacher = {
      id: editingTeacher?.id || `t${Date.now()}`,
      name: newTeacher.name || '',
      email: newTeacher.email || '',
      subject: selectedSubjects[0],
      subjects: selectedSubjects,
      levels: selectedLevels,
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
    setSelectedSubjects([subject]);
    setSelectedLevels([getRandomItem(LEVEL_DROPDOWN_OPTIONS)]);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 max-h-[60vh] overflow-y-auto pr-2">
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
           <div
             className="md:col-span-2 space-y-2 relative"
             ref={subjectDropdownRef}
             data-cy="teacher-subject-field"
           >
            <label className="block text-sm font-medium mb-1">
              {t.subject} <span className="text-destructive">*</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Assign at least one subject; multiple subjects are supported.
              </span>
            </label>
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
                   addSubject(subjectSearch);
                 }
               }}
               data-cy="teacher-subject-input"
            />
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedSubjects.map((subject) => (
                  <button
                    key={`selected-subject-${subject}`}
                    type="button"
                    className={tagButtonClass}
                    onClick={() => removeSubject(subject)}
                  >
                    {subject}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            )}
            <div
              className={cn(
                'absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-lg',
                isSubjectDropdownOpen ? 'block' : 'hidden'
              )}
            >
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
            className="md:col-span-2 space-y-2 relative"
            ref={levelDropdownRef}
            data-cy="teacher-level-field"
          >
            <label className="block text-sm font-medium mb-1">
              Standard / Form <span className="text-destructive">*</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Pick the grade tag that matches the tutor&apos;s assignment (Standard 1-6 or Form 1-6).
              </span>
            </label>
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
                  addLevel(levelSearch);
                }
              }}
              data-cy="teacher-level-input"
            />
            {selectedLevels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedLevels.map((level) => (
                  <button
                    key={`selected-level-${level}`}
                    type="button"
                    className={tagButtonClass}
                    onClick={() => removeLevel(level)}
                  >
                    {level}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Primary uses Standard 1-6 · Secondary uses Form 1-6 grade tags.
            </p>
            <div
              className={cn(
                'absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-lg',
                isLevelDropdownOpen ? 'block' : 'hidden'
              )}
            >
              {filteredLevelOptions.filter(option => !selectedLevels.includes(option)).length > 0 ? (
                filteredLevelOptions
                  .filter(option => !selectedLevels.includes(option))
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
