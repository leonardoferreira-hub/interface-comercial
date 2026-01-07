import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Calculator, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'relatorios', label: 'Relatórios', path: '/relatorios', icon: FileSpreadsheet },
  { id: 'calculadora', label: 'Calculadora', path: '/calculadora', icon: Calculator },
  { id: 'proposta', label: 'Proposta', path: '/proposta', icon: FileText },
];

export function NavigationTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
