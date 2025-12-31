'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import TransactionForm from './transaction-form';
import { deleteTransaction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  category: {
    name: string;
    icon: string;
  };
  creditCardId?: string;
}

interface CreditCardTransactionsProps {
  creditCardId: string;
  creditCardName: string;
  wallets: any[];
  categories: any[];
  creditCards: any[];
}

export function CreditCardTransactions({ creditCardId, creditCardName, wallets, categories, creditCards }: CreditCardTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [creditCardId, creditCardName]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      console.log(`[CreditCardTransactions] Fetching transactions for card: ${creditCardName} (${creditCardId})`);

      // Fetch all wallets with transactions
      const res = await fetch('/api/wallets');
      if (!res.ok) {
        console.error('Failed to fetch wallets');
        return;
      }

      const wallets = await res.json();
      console.log(`[CreditCardTransactions] Fetched ${wallets.length} wallets`);

      // Collect all transactions from all wallets
      const allTransactions: Transaction[] = [];
      for (const wallet of wallets) {
        if (wallet.transactions) {
          console.log(`[CreditCardTransactions] Wallet "${wallet.name}" has ${wallet.transactions.length} transactions`);
          allTransactions.push(...wallet.transactions);
        }
      }

      console.log(`[CreditCardTransactions] Total transactions collected: ${allTransactions.length}`);

      // Filter transactions related to this credit card by creditCardId
      const ccTransactions = allTransactions.filter((t: Transaction) => {
        // Primary filter: transactions explicitly linked to this credit card
        if (t.creditCardId === creditCardId) {
          console.log(`[CreditCardTransactions] ✓ Match by creditCardId: ${t.description} (${t.creditCardId})`);
          return true;
        }

        // Secondary filter: pattern matching for legacy transactions
        const desc = t.description.toLowerCase();
        const cardName = creditCardName.toLowerCase();

        // Check if transaction mentions the credit card
        const patternMatch = desc.includes(cardName) ||
               desc.includes('credit card') ||
               desc.includes('kartu kredit');

        if (patternMatch) {
          console.log(`[CreditCardTransactions] ✓ Match by pattern: ${t.description}`);
        }

        return patternMatch;
      });

      console.log(`[CreditCardTransactions] Filtered to ${ccTransactions.length} transactions for this card`);

      // Sort by date (newest first)
      ccTransactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(ccTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  const isCreditCardPayment = (description: string) => {
    return description.toLowerCase().includes('credit card payment') ||
           description.toLowerCase().includes('kartu kredit') ||
           description.toLowerCase().includes('pembayaran kartu kredit');
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully.',
      });
      fetchTransactions(); // Refresh the list
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete transaction.',
        variant: 'destructive',
      });
    }
  };

  const handleDialogChange = (txId: string, open: boolean) => {
    setDialogOpen(prev => ({...prev, [txId]: open}));
  };

  const handleFormSuccess = (txId: string) => {
    handleDialogChange(txId, false);
    fetchTransactions(); // Refresh the list
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Recent Transactions
          <Badge variant="secondary" className="ml-2">
            {transactions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions found for this credit card</p>
            <p className="text-sm mt-1">Transactions will appear here when you use this credit card</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </span>
                        <span>•</span>
                        <span>{transaction.category.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {isCreditCardPayment(transaction.description) ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`font-semibold text-sm ${
                          isCreditCardPayment(transaction.description) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isCreditCardPayment(transaction.description) ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <Badge
                        variant={isCreditCardPayment(transaction.description) ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {isCreditCardPayment(transaction.description) ? 'Payment' : 'Purchase'}
                      </Badge>
                      <div className="flex gap-1">
                        <Dialog open={dialogOpen[transaction.id]} onOpenChange={(open) => handleDialogChange(transaction.id, open)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Edit Transaction</DialogTitle>
                              <DialogDescription>
                                Update the details of your transaction.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                              <TransactionForm
                                wallets={wallets}
                                categories={categories}
                                creditCards={creditCards}
                                transaction={transaction}
                                onSuccess={() => handleFormSuccess(transaction.id)}
                              />
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this transaction.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(transaction.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
