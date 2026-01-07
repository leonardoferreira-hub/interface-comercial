import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface VolumeData {
  name: string;
  value: number;
  color: string;
}

interface VolumeBarChartProps {
  data: VolumeData[];
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'hsl(220, 9%, 46%)',
  enviada: 'hsl(207, 90%, 54%)',
  aceita: 'hsl(142, 71%, 29%)',
  rejeitada: 'hsl(0, 72%, 51%)',
  estruturando: 'hsl(27, 96%, 49%)',
  estruturada: 'hsl(142, 76%, 23%)',
  liquidada: 'hsl(207, 90%, 35%)',
  arquivada: 'hsl(220, 9%, 46%)',
};

export function VolumeBarChart({ data }: VolumeBarChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    color: STATUS_COLORS[item.name.toLowerCase()] || 'hsl(207, 90%, 54%)',
  }));

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
  };

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Volume por Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tickFormatter={formatValue} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatValue(value), 'Volume']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
