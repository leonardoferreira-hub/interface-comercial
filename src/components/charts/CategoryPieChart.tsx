import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

const COLORS = {
  DEB: 'hsl(207, 90%, 54%)',
  CRA: 'hsl(142, 71%, 29%)',
  CRI: 'hsl(27, 96%, 49%)',
  NC: 'hsl(280, 65%, 60%)',
  CR: 'hsl(340, 75%, 55%)',
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    color: COLORS[item.name as keyof typeof COLORS] || 'hsl(220, 9%, 46%)',
  }));

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, 'Quantidade']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
