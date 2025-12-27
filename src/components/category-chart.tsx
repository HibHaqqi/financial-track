'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, Category } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function CategoryChart({ transactions, categories }: CategoryChartProps) {
  const isMobile = useIsMobile();

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const data = categories
    .map((category) => {
      const total = expenseTransactions
        .filter((t) => t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: category.name,
        value: total,
      };
    })
    .filter((item) => item.value > 0);

  const chartHeight = isMobile ? 200 : 400;
  const outerRadius = isMobile ? 70 : 120;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                fontSize={isMobile ? 10 : 12}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('id-ID').format(value as number)
                }
              />
              <Legend
                verticalAlign={isMobile ? "bottom" : "top"}
                align="center"
                fontSize={isMobile ? 10 : 12}
                wrapperStyle={isMobile ? { fontSize: '10px' } : {}}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] sm:h-[400px] items-center justify-center text-muted-foreground">
            No expense data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
