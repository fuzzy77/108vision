import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatTokens, formatCurrency } from '@/lib/utils';

interface ModelBreakdownProps {
  data: { model: string; tokens: number; cost: number }[];
  type?: 'tokens' | 'cost';
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function ModelBreakdown({ data, type = 'tokens' }: ModelBreakdownProps) {
  const chartData = data.map((item) => ({
    name: item.model,
    value: type === 'tokens' ? item.tokens : item.cost,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number) => [
            type === 'tokens' ? formatTokens(value) : formatCurrency(value),
            type === 'tokens' ? 'Token' : 'Costo',
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { ModelBreakdown };
