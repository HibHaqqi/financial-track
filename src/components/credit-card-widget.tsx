'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, TrendingDown, Wallet, Edit, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreditCardForm } from './credit-card-form';
import { InstallmentList } from './installment-list';
import { CreditCardPaymentForm } from './credit-card-payment-form';
import { CreditCardMonthlyBilling } from './credit-card-monthly-billing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface CreditCardWidgetProps {
  creditCards: CreditCardData[];
  installments: InstallmentData[];
  wallets?: any[];
  categories?: any[];
  onRefresh?: () => void;
  onAddCard?: () => void;
  onDeleteCard?: (id: string) => void;
  onUpdateCard?: (id: string, updates: any) => void;
}

export default function CreditCardWidget({
  creditCards,
  installments,
  wallets = [],
  categories = [],
  onRefresh,
  onAddCard,
  onDeleteCard,
  onUpdateCard
}: CreditCardWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentCard, setPaymentCard] = useState<CreditCardData | null>(null);
  const [expandedBillingCardId, setExpandedBillingCardId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAvailableLimit = (card: CreditCardData) => {
    return card.totalLimit - card.usedLimit;
  };

  const getUsagePercentage = (card: CreditCardData) => {
    return (card.usedLimit / card.totalLimit) * 100;
  };

  const getTotalMonthlyInstallment = () => {
    return installments
      .filter(inst => inst.currentInstallment <= inst.tenor)
      .reduce((sum, inst) => sum + inst.monthlyPayment, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Cards
        </h2>
        <Button 
          onClick={() => {
            setSelectedCard(null);
            setShowForm(true);
          }}
          size="sm"
        >
          Add Card
        </Button>
      </div>

      {/* Monthly Installment Summary */}
      {installments.length > 0 && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Monthly Installment Burden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(getTotalMonthlyInstallment())}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {installments.filter(i => i.currentInstallment <= i.tenor).length} active installment(s)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Credit Cards List */}
      <div className="grid gap-4 md:grid-cols-2">
        {creditCards.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No credit cards added yet. Click &quot;Add Card&quot; to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          creditCards.map((card) => {
            const availableLimit = getAvailableLimit(card);
            const usagePercentage = getUsagePercentage(card);
            const cardInstallments = installments.filter(i => i.creditCardId === card.id);

            return (
              <Card
                key={card.id}
                className="relative overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16" />

                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {card.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentCard(card);
                          setShowPaymentForm(true);
                        }}
                        className="gap-1"
                      >
                        <Wallet className="h-3 w-3" />
                        Pay
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCard(card);
                              setShowForm(true);
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Card
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${card.name}"?`)) {
                                onDeleteCard?.(card.id);
                              }
                            }}
                            className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    Billing Date: {card.billingDate}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Limit Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(availableLimit)}
                      </span>
                    </div>
                    <Progress
                      value={100 - usagePercentage}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Used: {formatCurrency(card.usedLimit)}</span>
                      <span>Limit: {formatCurrency(card.totalLimit)}</span>
                    </div>
                  </div>

                  {/* Active Installments Count */}
                  {cardInstallments.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {cardInstallments.filter(i => i.currentInstallment <= i.tenor).length} active installment(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Monthly Billing Section - Show for each card */}
      {creditCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Monthly Billing</h3>
          {creditCards.map((card) => (
            <Collapsible
              key={`billing-${card.id}`}
              open={expandedBillingCardId === card.id}
              onOpenChange={(open) => setExpandedBillingCardId(open ? card.id : null)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {card.name} - Monthly Bill
                  </span>
                  {expandedBillingCardId === card.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CreditCardMonthlyBilling
                  creditCardId={card.id}
                  creditCardName={card.name}
                  billingDate={card.billingDate}
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Installments Section */}
      {installments.length > 0 && (
        <InstallmentList 
          installments={installments} 
          creditCards={creditCards}
          onRefresh={onRefresh}
        />
      )}

      {/* Form Dialog */}
      {showForm && (
        <CreditCardForm
          card={selectedCard}
          onClose={() => {
            setShowForm(false);
            setSelectedCard(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedCard(null);
            onRefresh?.();
          }}
        />
      )}

      {/* Payment Form Dialog */}
      {showPaymentForm && paymentCard && (
        <CreditCardPaymentForm
          open={showPaymentForm}
          onClose={() => {
            setShowPaymentForm(false);
            setPaymentCard(null);
          }}
          onSuccess={() => {
            setShowPaymentForm(false);
            setPaymentCard(null);
            onRefresh?.();
          }}
          creditCard={paymentCard}
          wallets={wallets}
          categories={categories}
        />
      )}
    </div>
  );
}
