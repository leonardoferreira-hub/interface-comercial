import { Calculator, BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Calculadora de Cotações</h1>
              <p className="text-xs text-muted-foreground">Sistema de Pipeline de Emissões</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
