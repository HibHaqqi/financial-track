'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface MonthlyBillingData {
  period: string;
  purchases: number;
  installmentPayments: number;
  payments: number;
  totalBill: number;
}

interface CreditCardMonthlyBillingProps {
  creditCardId: string;
  creditCardName: string;
  billingDate: number;
}

export function CreditCardMonthlyBilling({
  creditCardId,
  creditCardName,
  billingDate,
}: CreditCardMonthlyBillingProps) {
  const [billing, setBilling] = useState<MonthlyBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchBilling();
  }, [creditCardId, selectedYear, selectedMonth]);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/credit-cards/${creditCardId}/billing?year=${selectedYear}&month=${selectedMonth}`
      );

      if (response.ok) {
        const data = await response.json();
        setBilling(data);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2025, i, 1), 'MMMM'),
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading billing information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!billing) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Monthly Bill (Tagihan)
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Billing period: {billing.period} (Statement date: {billingDate})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Purchases
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(billing.purchases)}
            </div>
          </div>

          <div className="bg-white/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              Installments
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(billing.installmentPayments)}
            </div>
          </div>

          <div className="bg-white/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              Payments
            </div>
            <div className="text-xl font-bold text-green-600">
              -{formatCurrency(billing.payments)}
            </div>
          </div>
        </div>

        {/* Total Bill */}
        <div className="bg-white p-6 rounded-lg border-2 border-blue-300">
          <div className="text-sm text-muted-foreground mb-2">Total Bill (Tagihan)</div>
          <div className="text-4xl font-bold text-blue-600">
            {formatCurrency(billing.totalBill)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Purchases + Installments - Payments
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
