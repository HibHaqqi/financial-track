'use client';

import { useEffect, useState } from 'react';
import CreditCardWidget from './credit-card-widget';
import { CreditCardForm } from './credit-card-form';
import { CreditCardTransactions } from './credit-card-transactions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, CreditCard } from 'lucide-react';

interface CreditCard {
  id: string;
  name: string;
  totalLimit: number;
  usedLimit: number;
  billingDate: number;
  installments?: any[];
}

interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  monthlyPayment: number;
  tenor: number;
  currentInstallment: number;
  startDate: Date;
  creditCard: CreditCard;
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

interface CreditCardListProps {
  initialWallets?: any[];
  initialCategories?: any[];
  initialCreditCards?: CreditCard[];
  initialInstallments?: Installment[];
}

export default function CreditCardList({
  initialWallets = [],
  initialCategories = [],
  initialCreditCards = [],
  initialInstallments = []
}: CreditCardListProps) {
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards);
  const [installments, setInstallments] = useState<Installment[]>(initialInstallments);
  const [wallets, setWallets] = useState<any[]>(initialWallets);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [loading, setLoading] = useState(false); // Don't show loading since we have initial data
  const [showForm, setShowForm] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialCreditCards.length === 0) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch credit cards
      const cardsRes = await fetch('/api/credit-cards');
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCreditCards(cardsData);
      }

      // Fetch active installments
      const instRes = await fetch('/api/installments?active=true');
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstallments(instData);
      }

      // Fetch wallets
      const walletsRes = await fetch('/api/wallets');
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData);
      }

      // Fetch categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (cardData: { name: string; totalLimit: number; billingDate: number }) => {
    try {
      const res = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      if (res.ok) {
        setShowForm(false);
        fetchData(); // Refresh data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add credit card');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Failed to add credit card');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit card?')) return;

    try {
      const res = await fetch(`/api/credit-cards/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete credit card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete credit card');
    }
  };

  const handleUpdateCard = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update credit card');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update credit card');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading credit cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Card Widget */}
      <CreditCardWidget
        creditCards={creditCards}
        installments={installments}
        wallets={wallets}
        categories={categories}
        onAddCard={() => setShowForm(true)}
        onDeleteCard={handleDeleteCard}
        onUpdateCard={handleUpdateCard}
        onRefresh={fetchData}
      />

      {/* Per-Card Transaction Lists */}
      {creditCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Credit Card Transactions</h3>
          {creditCards.map((card) => (
            <Collapsible
              key={card.id}
              open={expandedCardId === card.id}
              onOpenChange={(open) => setExpandedCardId(open ? card.id : null)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {card.name}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    expandedCardId === card.id ? 'transform rotate-180' : ''
                  }`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CreditCardTransactions
                  creditCardId={card.id}
                  creditCardName={card.name}
                  wallets={wallets}
                  categories={categories}
                  creditCards={creditCards}
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <CreditCardForm
          card={null}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
