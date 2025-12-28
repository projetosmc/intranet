import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTools } from '@/hooks/useTools';
import * as LucideIcons from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const routes = [
  { name: 'Home', path: '/', icon: 'Home' },
  { name: 'Ferramentas', path: '/ferramentas', icon: 'Grid3X3' },
  { name: 'Comunicados', path: '/comunicados', icon: 'Megaphone' },
  { name: 'Status', path: '/status', icon: 'Activity' },
  { name: 'Suporte', path: '/suporte', icon: 'HelpCircle' },
  { name: 'Admin Ferramentas', path: '/admin/ferramentas', icon: 'Settings' },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { tools, recordAccess } = useTools();

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="mr-2 h-4 w-4" /> : null;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar ferramentas, páginas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {routes.map((route) => (
            <CommandItem
              key={route.path}
              onSelect={() => runCommand(() => navigate(route.path))}
            >
              {getIcon(route.icon)}
              <span>{route.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ferramentas">
          {tools.map((tool) => (
            <CommandItem
              key={tool.id}
              onSelect={() => runCommand(() => {
                recordAccess(tool.id);
                window.open(tool.url, '_blank');
              })}
            >
              {getIcon(tool.icon)}
              <span>{tool.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{tool.area}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
