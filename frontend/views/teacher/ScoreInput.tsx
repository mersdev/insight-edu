
import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2 } from 'lucide-react';
import { Button, Card, Input, Dialog, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { Student, ClassGroup } from '../../types';

interface ScoreInputProps {
  t: any;
  students: Student[];
  classes: ClassGroup[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onShowToast: (message: string) => void;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({ t, students, classes, selectedClassId, onSelectClass, onShowToast }) => {
  const [scoreColumns, setScoreColumns] = useState(['Exam 1']);
  const [isAddColOpen, setAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  
  // State for scores: { studentId: { colName: value } }
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  
  // View Mode: 'READ' (Default) | 'EDIT'
  const [viewMode, setViewMode] = useState<'READ' | 'EDIT'>('READ');
  
  const classStudents = students.filter(s => (s.classIds || []).includes(selectedClassId));

  // Trigger Toast when entering Read Mode
  useEffect(() => {
    if (viewMode === 'READ') {
        onShowToast("Reading Mode enabled. Switch to Edit to update scores.");
    }
  }, [viewMode, onShowToast]);

  const handleAddColumn = () => {
    if (newColName) {
      setScoreColumns([...scoreColumns, newColName]);
      setNewColName('');
      setAddColOpen(false);
    }
  };

  const updateScore = (studentId: string, col: string, val: string) => {
    setScores(prev => ({
        ...prev,
        [studentId]: {
            ...(prev[studentId] || {}),
            [col]: val
        }
    }));
  };

  return (
    <div className="pb-32 md:pb-8 max-w-lg mx-auto md:max-w-none animate-in fade-in duration-300">
        
        {/* Header Section */}
        <div className="space-y-4 mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Score Input</h1>
            
            {/* Class Selector */}
            <Select 
                value={selectedClassId} 
                onChange={(e) => onSelectClass(e.target.value)}
                className="h-12 bg-gray-100/50 border-transparent hover:bg-gray-100 focus:bg-white transition-all text-base font-medium rounded-xl"
            >
                {classes.length === 0 && <option value="">{t.noClassesAvailable}</option>}
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
        </div>

        {/* Controls - EDIT MODE (Top) */}
        {viewMode === 'EDIT' && (
            <div className="flex gap-3 mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                 <Button 
                    variant="outline" 
                    className="flex-1 h-12 bg-white border-gray-200 text-foreground hover:bg-gray-50 rounded-xl shadow-sm"
                    onClick={() => setViewMode('READ')}
                 >
                    <Eye className="w-4 h-4 mr-2" />
                    {t.glanceView}
                 </Button>
                 <Button 
                    onClick={() => setAddColOpen(true)} 
                    className="flex-1 h-12 bg-black text-white hover:bg-black/90 rounded-xl shadow-sm"
                 >
                    <Plus className="mr-2 h-4 w-4" /> 
                    {t.addCol}
                 </Button>
            </div>
        )}

        {/* --- DESKTOP TABLE VIEW --- */}
        <div className="hidden md:block">
            <Card className="overflow-visible border shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[300px]">Student Name</TableHead>
                            {scoreColumns.map((col) => (
                                <TableHead key={col} className="min-w-[150px] text-right">
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classStudents.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-semibold text-base py-4">
                                    {student.name}
                                </TableCell>
                                {scoreColumns.map((col) => {
                                    const scoreVal = scores[student.id]?.[col] || '';
                                    return (
                                        <TableCell key={col} className="text-right p-2">
                                            {viewMode === 'EDIT' ? (
                                                <div className="flex items-center justify-end">
                                                    <div className="flex items-center bg-gray-100 rounded-lg px-3 h-10 w-28 relative transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 border border-transparent focus-within:border-gray-200">
                                                        <input 
                                                            type="number" 
                                                            placeholder="-"
                                                            value={scoreVal}
                                                            onChange={(e) => updateScore(student.id, col, e.target.value)}
                                                            className="bg-transparent w-full text-right font-bold outline-none placeholder:text-gray-400 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-medium text-gray-700 pr-4">
                                                    {scoreVal || '-'}
                                                </div>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        {classStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={scoreColumns.length + 1} className="h-24 text-center text-muted-foreground">
                                    {classes.length === 0 ? t.createClassFirst : t.noStudentsInClass}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>

        {/* --- MOBILE CARD VIEW --- */}
        <div className="md:hidden space-y-4">
             {classStudents.map(student => (
                 <Card key={student.id} className="p-5 border-gray-100 shadow-sm rounded-2xl bg-white">
                     <div className="font-bold text-lg mb-5 text-foreground">{student.name}</div>
                     
                     <div className="space-y-4">
                         {scoreColumns.map((col) => {
                             const scoreVal = scores[student.id]?.[col] || '';
                             return (
                                 <div key={col} className="flex items-center justify-between gap-4">
                                     <label className="text-base text-gray-600 font-medium">{col}</label>
                                     <div className="relative w-40 sm:w-48">
                                        {viewMode === 'EDIT' ? (
                                            <div className="flex items-center bg-gray-100 rounded-xl px-4 h-12 w-full relative transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-auto tracking-wider">SCORE</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="-"
                                                    value={scoreVal}
                                                    onChange={(e) => updateScore(student.id, col, e.target.value)}
                                                    className="bg-transparent w-full text-right font-bold text-lg outline-none placeholder:text-gray-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-gray-100 rounded-xl px-4 h-12 w-full relative">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-auto tracking-wider">SCORE</span>
                                                <div className="w-full text-right font-bold text-lg text-foreground/80">
                                                    {scoreVal || '-'}
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </Card>
             ))}
             
             {classStudents.length === 0 && (
                <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    {classes.length === 0 ? t.createClassFirst : t.noStudentsInClass}
                </div>
             )}
        </div>

        {/* Controls - READ MODE (Bottom Sticky) */}
        {viewMode === 'READ' && (
             <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-30 md:static md:bg-transparent md:border-none md:p-0 md:mt-8 animate-in slide-in-from-bottom-4 duration-300">
                 <div className="max-w-lg mx-auto md:max-w-none space-y-3">
                     <Button 
                        onClick={() => setViewMode('EDIT')} 
                        className="w-full h-12 bg-black text-white hover:bg-black/90 rounded-xl shadow-lg text-base font-semibold"
                     >
                        <Edit2 className="mr-2 h-4 w-4" /> {t.editScores}
                     </Button>
                 </div>
             </div>
        )}

        {/* Add Column Dialog */}
        <Dialog isOpen={isAddColOpen} onClose={() => setAddColOpen(false)} title={t.addAssessmentColumn} 
            footer={<><Button variant="ghost" onClick={() => setAddColOpen(false)}>{t.cancel}</Button><Button onClick={handleAddColumn}>{t.add}</Button></>}>
            <div className="py-4">
            <label className="block text-sm font-medium mb-2">{t.columnName}</label>
            <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder={t.columnNamePlaceholder} autoFocus />
            </div>
        </Dialog>
    </div>
  );
};
