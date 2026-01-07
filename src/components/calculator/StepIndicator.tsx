import { Check } from 'lucide-react';

const stepLabels: Record<number, string[]> = {
  2: ['Dados Básicos', 'Custos & Prestadores'],
  3: ['Dados Básicos', 'Prestadores', 'Custos'],
};

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const labels = stepLabels[totalSteps] || stepLabels[2];

  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  isCompleted
                    ? 'bg-success text-success-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {labels[index]}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-16 h-1 mx-2 rounded-full transition-all ${
                  isCompleted ? 'bg-success' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
