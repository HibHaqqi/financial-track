'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BalanceChartProps {
  transactions: Transaction[];
}

export default function BalanceChart({ transactions }: BalanceChartProps) {
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { name: string; income: number; expense: number, date: Date } } = {};

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { name: monthYear, income: 0, expense: 0, date: date };
      }

      if (tx.type === 'income') {
        monthlyData[monthYear].income += tx.amount;
      } else {
        monthlyData[monthYear].expense += tx.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions]);

  const chartHeight = isMobile ? 250 : 400;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Income vs. Expense</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: isMobile ? 10 : 30,
                left: isMobile ? 0 : 20,
                bottom: isMobile ? 30 : 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
                interval={0}
                fontSize={isMobile ? 10 : 12}
              />
              <YAxis
                width={isMobile ? 40 : 60}
                fontSize={isMobile ? 10 : 12}
                tickFormatter={(value) =>
                  isMobile ? `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}` : value
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('id-ID').format(value as number)
                }
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              {!isMobile && <Legend />}
              <Bar dataKey="income" stackId="a" fill="hsl(var(--chart-1))" name="Income" />
              <Bar dataKey="expense" stackId="a" fill="hsl(var(--chart-2))" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] sm:h-[400px] items-center justify-center text-muted-foreground">
            No transaction data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
