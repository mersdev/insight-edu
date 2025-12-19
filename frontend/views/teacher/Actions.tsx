
import React from 'react';
import { Select } from '../../components/ui';
import { ClassGroup } from '../../types';

interface TeacherActionsProps {
  t: any;
  classes: ClassGroup[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
}

export const TeacherActions: React.FC<TeacherActionsProps> = ({ t, classes, selectedClassId, onSelectClass }) => {
  return (
    <div className="flex items-center gap-4 bg-background p-3 rounded-lg border shadow-sm w-full">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{t.selectClass}</span>
      <Select 
        value={selectedClassId} 
        onChange={(e) => onSelectClass(e.target.value)}
        className="h-11 w-full bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors text-base font-medium"
      >
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
    </div>
  );
};
