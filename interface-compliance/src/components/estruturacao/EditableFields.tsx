import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { StatusOkNok, StatusBoletagem, Usuario } from '@/types/dados-estruturacao';

// Campo de texto editável
interface EditableTextFieldProps {
  label: string;
  value: string | null | undefined;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function EditableTextField({ 
  label, 
  value, 
  onSave, 
  placeholder = 'Não informado',
  multiline = false 
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  
  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTempValue(value || '');
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex gap-2">
          {multiline ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="min-h-[60px] flex-1"
              autoFocus
            />
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1"
              autoFocus
            />
          )}
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" onClick={handleSave} className="h-6 w-6">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} className="h-6 w-6">
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-1 group">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
        onClick={() => {
          setTempValue(value || '');
          setIsEditing(true);
        }}
      >
        <span className={cn('flex-1', !value && 'text-muted-foreground italic')}>
          {value || placeholder}
        </span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// Campo de data editável
interface EditableDateFieldProps {
  label: string;
  value: string | null | undefined;
  onSave: (value: string | null) => void;
}

export function EditableDateField({ label, value, onSave }: EditableDateFieldProps) {
  const [open, setOpen] = useState(false);
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onSave(format(date, 'yyyy-MM-dd'));
    } else {
      onSave(null);
    }
    setOpen(false);
  };
  
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Campo de seleção de status OK/NOK
interface StatusOkNokFieldProps {
  label: string;
  value: StatusOkNok | null | undefined;
  onSave: (value: StatusOkNok) => void;
}

export function StatusOkNokField({ label, value, onSave }: StatusOkNokFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || 'pendente'} onValueChange={(v) => onSave(v as StatusOkNok)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ok">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              OK
            </span>
          </SelectItem>
          <SelectItem value="nok">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              NOK
            </span>
          </SelectItem>
          <SelectItem value="pendente">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Pendente
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Campo de seleção de boletagem
interface StatusBoletagemFieldProps {
  label: string;
  value: StatusBoletagem | null | undefined;
  onSave: (value: StatusBoletagem) => void;
}

export function StatusBoletagemField({ label, value, onSave }: StatusBoletagemFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || 'pendente'} onValueChange={(v) => onSave(v as StatusBoletagem)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sim">Sim</SelectItem>
          <SelectItem value="nao">Não</SelectItem>
          <SelectItem value="na">N/A</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Campo de seleção de usuário
interface UserSelectFieldProps {
  label: string;
  value: string | null | undefined;
  usuarios: Usuario[];
  onSave: (value: string | null) => void;
  placeholder?: string;
}

export function UserSelectField({ label, value, usuarios, onSave, placeholder = 'Selecionar' }: UserSelectFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || '__none__'} onValueChange={(v) => onSave(v === '__none__' ? null : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">{placeholder}</span>
          </SelectItem>
          {usuarios.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id}>
              {usuario.nome_completo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Campo de seleção de boolean (Sim/Não)
interface BooleanFieldProps {
  label: string;
  value: boolean | null | undefined;
  onSave: (value: boolean) => void;
}

export function BooleanField({ label, value, onSave }: BooleanFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value ? 'sim' : 'nao'} onValueChange={(v) => onSave(v === 'sim')}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sim">Sim</SelectItem>
          <SelectItem value="nao">Não</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
