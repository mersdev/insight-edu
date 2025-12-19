
import React, { useState } from 'react';
import { Trash2, Plus, MapPin, Search, ArrowUpDown, Sparkles } from 'lucide-react';
import { Card, Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { Location, ClassGroup } from '../../types';
import { api } from '../../services/backendApi';
import { getRandomItem, malaysianLocations } from '../../utils/malaysianSampleData';

interface LocationsProps {
  t: any;
  locations: Location[];
  setLocations: (locations: Location[]) => void;
  classes: ClassGroup[];
}

export const Locations: React.FC<LocationsProps> = ({ t, locations, setLocations, classes }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({ 
    name: '', address: '' 
  });
  
  // Search and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleDelete = async (id: string) => {
    // Check if any class is assigned to this location
    const assignedClasses = classes.filter(c => c.locationId === id);
    if (assignedClasses.length > 0) {
      setErrorDialog(`Cannot delete this location. It is assigned to ${assignedClasses.length} class(es).`);
      return;
    }

    if (confirm(t.deleteLocationConfirm)) {
      await api.deleteLocation(id);
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const handleAdd = async () => {
    if (newLocation.name) {
      const location = await api.createLocation({
        id: `l${Date.now()}`,
        name: newLocation.name,
        address: newLocation.address || ''
      } as Location);

      setLocations([...locations, location]);
      setNewLocation({ name: '', address: '' });
      setDialogOpen(false);
    }
  };

  const handleAutoFillLocation = () => {
    const location = getRandomItem(malaysianLocations);
    setNewLocation({
      name: location.name,
      address: location.address,
    });
  };
  
  const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredLocations = locations.filter(loc => 
    (loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
     return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-2">
         <h1 className="text-3xl font-bold tracking-tight">{t.locations}</h1>
         <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> {t.add}
            </Button>
         </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
           type="search"
           placeholder="Search locations..."
           className="pl-9 w-full md:w-96 h-10"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      <Card className="overflow-visible">
        <Table wrapperClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                     {t.locationName}
                     <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
              </TableHead>
              <TableHead>{t.address}</TableHead>
              <TableHead>{t.registeredClasses}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.map((loc) => {
                const locClasses = classes.filter(c => c.locationId === loc.id);
                return (
                    <TableRow key={loc.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {loc.name}
                            </div>
                        </TableCell>
                        <TableCell>{loc.address || '-'}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {locClasses.length > 0 ? (
                                    locClasses.map(c => (
                                        <Badge key={c.id} variant="secondary" className="text-[10px] whitespace-nowrap">{c.name}</Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                );
            })}
            {filteredLocations.length === 0 && (
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
        title={t.addNewLocation}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleAutoFillLocation}
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
        <div className="space-y-4 py-2">
           <div>
             <label className="block text-sm font-medium mb-1">{t.locationName} *</label>
             <Input 
                value={newLocation.name} 
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} 
                placeholder={t.locationNamePlaceholder} 
             />
           </div>
           <div>
             <label className="block text-sm font-medium mb-1">{t.address}</label>
             <Input 
                value={newLocation.address} 
                onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} 
                placeholder={t.addressPlaceholder} 
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