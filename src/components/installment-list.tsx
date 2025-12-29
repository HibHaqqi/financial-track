'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface InstallmentData {
    id: string;
    description: string;
    totalAmount: number;
    monthlyPayment: number;
    tenor: number;
    currentInstallment: number;
    startDate: Date;
    creditCardId: string;
    categoryId: string;
}

interface CreditCardData {
    id: string;
    name: string;
    totalLimit: number;
    usedLimit: number;
    billingDate: number;
}

interface InstallmentListProps {
    installments: InstallmentData[];
    creditCards: CreditCardData[];
    onRefresh?: () => void;
}

export function InstallmentList({ installments, creditCards }: InstallmentListProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getInstallmentProgress = (installment: InstallmentData) => {
        return (installment.currentInstallment / installment.tenor) * 100;
    };

    const getRemainingMonths = (installment: InstallmentData) => {
        return installment.tenor - installment.currentInstallment;
    };

    const isCompleted = (installment: InstallmentData) => {
        return installment.currentInstallment >= installment.tenor;
    };

    const activeInstallments = installments.filter(i => !isCompleted(i));
    const completedInstallments = installments.filter(i => isCompleted(i));

    return (
        <div className="space-y-4">
            {/* Active Installments */}
            {activeInstallments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Active Installments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeInstallments.map((installment) => {
                            const card = creditCards.find(c => c.id === installment.creditCardId);
                            const progress = getInstallmentProgress(installment);
                            const remaining = getRemainingMonths(installment);

                            return (
                                <div
                                    key={installment.id}
                                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm mb-1">
                                                {installment.description}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {card?.name || 'Unknown Card'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(installment.startDate), 'MMM yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">
                                            {installment.currentInstallment}/{installment.tenor} months
                                        </Badge>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <Progress value={progress} className="h-2" />
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {remaining} month(s) remaining
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(installment.monthlyPayment)}/month
                                            </span>
                                        </div>
                                    </div>

                                    {/* Amount Info */}
                                    <div className="flex justify-between items-center pt-2 border-t text-sm">
                                        <span className="text-muted-foreground">Total Amount</span>
                                        <span className="font-bold">{formatCurrency(installment.totalAmount)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Completed Installments */}
            {completedInstallments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            Completed Installments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {completedInstallments.map((installment) => {
                            const card = creditCards.find(c => c.id === installment.creditCardId);

                            return (
                                <div
                                    key={installment.id}
                                    className="p-3 border rounded-lg bg-muted/30 space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-muted-foreground">
                                                {installment.description}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {card?.name} • {installment.tenor} months • {formatCurrency(installment.totalAmount)}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Completed
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {installments.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            No installments found. Add a transaction with installment option to get started.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
