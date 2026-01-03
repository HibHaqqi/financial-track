'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
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
  const [allBillings, setAllBillings] = useState<MonthlyBillingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    if (viewMode === 'yearly' || selectedMonth === 'all') {
      fetchAllBillings();
    } else {
      fetchSingleBilling();
    }
  }, [creditCardId, selectedYear, selectedMonth, viewMode]);

  const fetchSingleBilling = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/credit-cards/${creditCardId}/billing?year=${selectedYear}&month=${selectedMonth}`
      );

      if (response.ok) {
        const data = await response.json();
        setBilling(data);
        setAllBillings([]);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBillings = async () => {
    try {
      setLoading(true);
      const promises = [];
      for (let month = 1; month <= 12; month++) {
        promises.push(
          fetch(`/api/credit-cards/${creditCardId}/billing?year=${selectedYear}&month=${month}`)
        );
      }

      const responses = await Promise.all(promises);
      const data = await Promise.all(
        responses.map(res => res.ok ? res.json() : null)
      );

      // Filter out null responses and sort by month
      const validBillings = data
        .filter((item): item is MonthlyBillingData => item !== null)
        .sort((a, b) => {
          const monthA = new Date(a.period).getMonth();
          const monthB = new Date(b.period).getMonth();
          return monthB - monthA; // Sort descending (newest first)
        });

      setAllBillings(validBillings);
      setBilling(null);
    } catch (error) {
      console.error('Error fetching billings:', error);
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

  // Calculate yearly totals
  const yearlyTotals = allBillings.reduce(
    (acc, billing) => ({
      purchases: acc.purchases + billing.purchases,
      installmentPayments: acc.installmentPayments + billing.installmentPayments,
      payments: acc.payments + billing.payments,
      totalBill: acc.totalBill + billing.totalBill,
    }),
    { purchases: 0, installmentPayments: 0, payments: 0, totalBill: 0 }
  );

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

  if (!billing && allBillings.length === 0) {
    return null;
  }

  // Yearly View - Show all months
  if (allBillings.length > 0) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Yearly Bill Summary ({selectedYear})
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => {
                  if (v === 'all') {
                    setSelectedMonth('all');
                    setViewMode('yearly');
                  } else {
                    setSelectedMonth(parseInt(v));
                    setViewMode('monthly');
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
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
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Yearly Totals */}
          <div className="bg-white p-6 rounded-lg border-2 border-blue-400">
            <div className="text-sm text-muted-foreground mb-4">Yearly Totals</div>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Purchases</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(yearlyTotals.purchases)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Installments</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(yearlyTotals.installmentPayments)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Payments</div>
                <div className="text-2xl font-bold text-green-600">
                  -{formatCurrency(yearlyTotals.payments)}
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">Total Bill for {selectedYear}</div>
              <div className="text-4xl font-bold text-blue-600">
                {formatCurrency(yearlyTotals.totalBill)}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Monthly Breakdown</div>
            {allBillings.map((monthlyBilling, index) => (
              <div
                key={index}
                className="bg-white/70 p-4 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-blue-700">{monthlyBilling.period}</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(monthlyBilling.totalBill)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Purchases:</span>{' '}
                    {formatCurrency(monthlyBilling.purchases)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Installments:</span>{' '}
                    {formatCurrency(monthlyBilling.installmentPayments)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payments:</span>{' '}
                    <span className="text-green-600">-{formatCurrency(monthlyBilling.payments)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Monthly View - Single month
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Monthly Bill (Tagihan)
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => {
                if (v === 'all') {
                  setSelectedMonth('all');
                  setViewMode('yearly');
                } else {
                  setSelectedMonth(parseInt(v));
                  setViewMode('monthly');
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
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
