'use client';

import CreditCardWidget from './credit-card-widget';

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface CreditCardData {
    id: string;
    name: string;
    totalLimit: number;
    usedLimit: number;
    billingDate: number;
    userId: string;
}

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

interface CreditCardClientProps {
    creditCards: CreditCardData[];
    installments: InstallmentData[];
    categories: Category[];
}

export default function CreditCardClient({ creditCards, installments }: CreditCardClientProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Credit Cards</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your credit cards and track installment payments
                </p>
            </div>

            <CreditCardWidget
                creditCards={creditCards}
                installments={installments}
                onRefresh={() => window.location.reload()}
            />
        </div>
    );
}
