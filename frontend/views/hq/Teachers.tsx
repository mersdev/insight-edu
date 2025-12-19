
import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Mail, BookOpen, Search, ArrowUpDown, UserCheck, UserX, Sparkles } from 'lucide-react';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Badge } from '../../components/ui';
import { Teacher, ClassGroup, User } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomMalaysianName, getRandomItem, malaysianSubjects, malaysianPhoneNumbers, generateEmailFromName } from '../../utils/malaysianSampleData';

interface TeachersProps {
  t: any;
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  classes: ClassGroup[];
}

export const Teachers: React.FC<TeachersProps> = ({ t, teachers, setTeachers, classes }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({ 
    name: '', email: '', subject: '', englishName: '', chineseName: '', phone: '', description: '' 
  });
  const [users, setUsers] = useState<User[]>([]);
  
  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

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
    const unique = new Set(teachers.map(t => t.subject).filter(Boolean));
    return Array.from(unique).sort();
  }, [teachers]);

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

  const handleAdd = async () => {
    // Phone Validation
    const phoneRegex = /^01\d\s?-?\s?\d{3,4}\s\d{4}$/;
    if (newTeacher.phone && !phoneRegex.test(newTeacher.phone)) {
        setErrorDialog('Phone number must match format 01X-XXX XXXX or 01X - XXXX XXXX');
        return;
    }

    if (newTeacher.name && newTeacher.email) {
      const teacher = await api.createTeacher({
        id: `t${Date.now()}`,
        name: newTeacher.name || '',
        email: newTeacher.email || '',
        subject: newTeacher.subject || '',
        englishName: newTeacher.englishName,
        chineseName: newTeacher.chineseName,
        phone: newTeacher.phone,
        description: newTeacher.description
      } as Teacher);

      setTeachers([...teachers, teacher]);
      setNewTeacher({ name: '', email: '', subject: '', englishName: '', chineseName: '', phone: '', description: '' });
      setDialogOpen(false);
    }
  };

  const handleAutoFillTeacher = () => {
    const teacherName = getRandomMalaysianName();
    const subject = getRandomItem(malaysianSubjects);
    const phone = getRandomItem(malaysianPhoneNumbers);
    const email = generateEmailFromName(teacherName.full);
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
      subject: subject,
      phone: phone,
      description: getRandomItem(descriptions),
    });
  };
  
  const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredTeachers = teachers.filter(teacher => 
    (teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (subjectFilter === 'ALL' || teacher.subject === subjectFilter)
  ).sort((a, b) => {
     return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-2">
         <h1 className="text-3xl font-bold tracking-tight">{t.teachers}</h1>
         <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)}>
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
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => {
               const hasAccount = users.some(u => u.email === teacher.email);
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
                    <div className="flex items-center">
                        <BookOpen className="w-3 h-3 mr-2 text-primary" />
                        {teacher.subject}
                    </div>
                    </TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
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
        onClose={() => setDialogOpen(false)}
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
              <Button onClick={handleAdd}>{t.save}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
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
                placeholder="01X-XXX XXXX" 
             />
             <p className="text-xs text-muted-foreground mt-1">Format: 01X-XXX XXXX</p>
           </div>
           <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium mb-1">{t.subject} *</label>
             <Input 
                value={newTeacher.subject} 
                onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} 
                placeholder={t.subjectPlaceholder} 
             />
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
