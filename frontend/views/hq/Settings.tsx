import React, { useEffect, useMemo, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Card, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Dialog, Badge } from '../../components/ui';
import { BehaviorRating, Student, Session, Teacher, RatingCategory } from '../../types';
import { api } from '../../services/backendApi';
import { DEFAULT_BEHAVIOR_CATEGORIES } from '../../constants';

interface SettingsPageProps {
  t: any;
  students: Student[];
  sessions: Session[];
  teachers: Teacher[];
  behaviors: BehaviorRating[];
  setBehaviors: (behaviors: BehaviorRating[]) => void;
  ratingCategories: RatingCategory[];
  refreshRatingCategories: () => Promise<RatingCategory[]>;
}

interface NewBehaviorForm {
  studentId: string;
  sessionId: string;
  teacherId: string;
  category: string;
  rating: number;
  date: string;
}

type DisplayRatingCategory = RatingCategory & { isFallback?: boolean };

const getTeacherDisplayName = (teacher?: Teacher | null) => {
  if (!teacher) return 'Teacher';
  return teacher.name || teacher.englishName || teacher.chineseName || teacher.email || 'Teacher';
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ t, students, sessions, teachers, behaviors, setBehaviors, ratingCategories, refreshRatingCategories }) => {
  const [behaviorList, setBehaviorList] = useState<BehaviorRating[]>(behaviors);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<NewBehaviorForm>({
    studentId: students[0]?.id || '',
    sessionId: sessions[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    category: DEFAULT_BEHAVIOR_CATEGORIES[0] || '',
    rating: 3,
    date: new Date().toISOString().slice(0, 16),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<BehaviorRating | null>(null);
  const [editRating, setEditRating] = useState(3);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editCategory, setEditCategory] = useState<string>(DEFAULT_BEHAVIOR_CATEGORIES[0] || '');
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RatingCategory | null>(null);
  const selectedTeacher = teachers.find((teacher) => teacher.id === form.teacherId);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((student) => student?.id && map.set(student.id, student));
    return map;
  }, [students]);

  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((teacher) => teacher?.id && map.set(teacher.id, teacher));
    return map;
  }, [teachers]);

  const sessionMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((session) => session?.id && map.set(session.id, session));
    return map;
  }, [sessions]);

  const categoriesWithDefaults = useMemo<DisplayRatingCategory[]>(() => {
    const merged: DisplayRatingCategory[] = ratingCategories.map((category) => ({
      ...category,
      isFallback: false,
    }));
    const seenNames = new Set(merged.map((category) => category.name));
    DEFAULT_BEHAVIOR_CATEGORIES.forEach((name, index) => {
      if (!seenNames.has(name)) {
        merged.push({
          id: -(index + 1),
          name,
          description: 'System default behavior category',
          isFallback: true,
        });
        seenNames.add(name);
      }
    });
    return merged;
  }, [ratingCategories]);

  const formattedBehaviors = useMemo(() => {
    return [...behaviorList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [behaviorList]);

  const resetForm = () => {
    setForm((prev) => ({
      studentId: prev.studentId || students[0]?.id || '',
      sessionId: prev.sessionId || sessions[0]?.id || '',
      teacherId: prev.teacherId || teachers[0]?.id || '',
      category:
        categoriesWithDefaults.find((category) => category.name === prev.category)?.name ||
        categoriesWithDefaults[0]?.name ||
        '',
      rating: 3,
      date: new Date().toISOString().slice(0, 16),
    }));
    setFormError(null);
  };

  const loadBehaviors = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAdminBehaviors();
      setBehaviorList(data);
      setBehaviors(data);
    } catch (error) {
      console.error('Failed to load behaviors', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBehaviors();
  }, []);

  useEffect(() => {
    resetForm();
  }, [students, sessions, teachers, ratingCategories]);

  const handleAddBehavior = async () => {
    if (!form.studentId || !form.sessionId || !form.teacherId) {
      setFormError('Student, session, and teacher are required.');
      return;
    }
    if (!categoriesWithDefaults.length || !form.category) {
      setFormError('Add at least one behavior category before recording a rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      setFormError(null);
      await api.createAdminBehavior({
        studentId: form.studentId,
        sessionId: form.sessionId,
        teacherId: form.teacherId,
        category: form.category,
        rating: form.rating,
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      });
      resetForm();
      await loadBehaviors();
    } catch (error) {
      console.error('Failed to add behavior', error);
      setFormError('Unable to save behavior entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (behavior: BehaviorRating) => {
    setEditingBehavior(behavior);
    setEditRating(behavior.rating);
    setEditTeacherId(behavior.teacherId || '');
    setEditCategory(behavior.category);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBehavior?.id) return;
    setIsSubmitting(true);
    try {
      await api.updateBehavior(editingBehavior.id, {
        rating: editRating,
        teacherId: editTeacherId,
        category: editCategory,
      });
      setIsEditDialogOpen(false);
      setEditingBehavior(null);
      await loadBehaviors();
    } catch (error) {
      console.error('Failed to update behavior', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCategoryDialog = (category?: RatingCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setCategoryError(null);
    setCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setCategoryError(null);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    setCategorySubmitting(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
      };
      if (editingCategory) {
        await api.updateRatingCategory(editingCategory.id, payload);
      } else {
        await api.createRatingCategory(payload);
      }
      await refreshRatingCategories();
      closeCategoryDialog();
    } catch (error) {
      console.error('Failed to save rating category', error);
      const message = error instanceof Error ? error.message : 'Unable to save category. Please try again.';
      setCategoryError(message);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: RatingCategory) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.deleteRatingCategory(category.id);
      await refreshRatingCategories();
    } catch (error) {
      console.error('Failed to delete rating category', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t.settings || 'Settings'}</h1>
      </div>

      {/* Layout guard: always keep the Behavior Indicators card first and Manual Behavior Indicator second */}
      <section
        data-layout-guard="behavior-indicators"
        className="space-y-5"
      >
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Behavior Indicators</h2>
              <p className="text-xs text-muted-foreground">
                Define and manage the categories tutors can rate for each session. Default categories stay visible until you customize them.
              </p>
            </div>
            <Button size="sm" onClick={() => openCategoryDialog()}>
              Add Category
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesWithDefaults.map((category) => {
                const description =
                  category.description || (category.isFallback ? 'System default behavior category' : '-');
                return (
                  <TableRow key={`behavior-category-${category.id}`}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{description}</TableCell>
                    <TableCell className="text-right">
                      {category.isFallback ? (
                        <span className="text-xs font-semibold text-muted-foreground">Default</span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openCategoryDialog(category)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Manual Behavior Indicator</h2>
                <p className="text-xs text-muted-foreground">
                  Record a behavior rating for a student, session, and teacher. Default categories stay pinned below.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_BEHAVIOR_CATEGORIES.map((category) => (
                  <Badge key={`default-${category}`} variant="outline" className="h-6 px-2 text-sm font-medium">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedTeacher && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="h-6 px-2 text-sm font-medium">
                  {getTeacherDisplayName(selectedTeacher)}
                </Badge>
                {selectedTeacher.subject && (
                  <Badge variant="outline" className="h-6 px-2 text-sm font-medium">
                    {selectedTeacher.subject}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Student</label>
              <Select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="" disabled>Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Session</label>
              <Select
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              >
                <option value="" disabled>Select Session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.date} · {session.startTime}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Teacher</label>
              <Select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              >
                <option value="" disabled>Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="" disabled>Select Category</option>
                {categoriesWithDefaults.map((category) => (
                  <option key={`${category.id}-${category.name}`} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Rating (1-5)</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Date</label>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddBehavior} disabled={isSubmitting || categoriesWithDefaults.length === 0}>
                {isSubmitting ? 'Saving...' : 'Save Behavior'}
              </Button>
            </div>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Session Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedBehaviors.map((behavior) => {
              const student = studentMap.get(behavior.studentId);
              const teacher = behavior.teacherId ? teacherMap.get(behavior.teacherId) : null;
              const teacherName = teacher ? getTeacherDisplayName(teacher) : behavior.teacherId || 'Teacher';
              const session = behavior.sessionId ? sessionMap.get(behavior.sessionId) : null;
              return (
                <TableRow key={behavior.id ?? `${behavior.studentId}-${behavior.date}`}>
                  <TableCell className="font-medium">{student?.name || behavior.studentId}</TableCell>
                  <TableCell>{session ? `${session.date} ${session.startTime}` : new Date(behavior.date).toLocaleString()}</TableCell>
                  <TableCell>{behavior.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                      {behavior.rating}/5
                    </Badge>
                  </TableCell>
                  <TableCell>{teacherName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(behavior)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {formattedBehaviors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No behavior entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        isOpen={isCategoryDialogOpen}
        onClose={closeCategoryDialog}
        title={editingCategory ? 'Edit Behavior Category' : 'Add Behavior Category'}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={closeCategoryDialog}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={isCategorySubmitting}>
              {isCategorySubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Category Name</label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Focus"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description for tutors"
            />
          </div>
          {categoryError && (
            <p className="text-xs text-destructive">{categoryError}</p>
          )}
        </div>
      </Dialog>

      <Dialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Update Behavior Rating"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editingBehavior || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
          <label className="text-sm font-medium">Category</label>
          <Select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
          >
            {categoriesWithDefaults.map((category) => (
              <option key={`${category.id}-${category.name}`} value={category.name}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
          <div>
            <label className="text-sm font-medium">Rating (1-5)</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={editRating}
              onChange={(e) => setEditRating(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Teacher</label>
            <Select
              value={editTeacherId}
              onChange={(e) => setEditTeacherId(e.target.value)}
            >
              <option value="" disabled>Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
