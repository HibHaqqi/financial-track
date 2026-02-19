'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Category, Wallet } from '@/lib/types';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TransactionForm from './transaction-form';
import { deleteTransaction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BlurredAmount } from './blurred-amount';


interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  creditCards?: any[];
}

export default function RecentTransactions({
  transactions,
  categories,
  wallets,
  creditCards = [],
}: RecentTransactionsProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({});

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'N/A';

  const getFundSourceBadge = (tx: Transaction) => {
    if (tx.creditCard) {
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
          <CreditCard className="h-2.5 w-2.5" />
          {tx.creditCard.name}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
        <WalletIcon className="h-2.5 w-2.5" />
        {tx.wallet?.name || 'Wallet'}
      </Badge>
    );
  };

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (id: string) => {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully.',
      });
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
  }

  const handleFormSuccess = (txId: string) => {
    handleDialogChange(txId, false);
  }

  // Mobile card layout
  if (isMobile) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3 px-3 pt-3">
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="px-3 space-y-2 pb-4">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx) => (
                  <Card key={tx.id} className="p-2">
                    <div className="flex items-start gap-2">
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        {tx.type === 'income' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">{tx.description}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(tx.date).toLocaleDateString()}
                          </div>
                          <div className="mt-1 flex gap-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {getCategoryName(tx.categoryId)}
                            </Badge>
                            {getFundSourceBadge(tx)}
                          </div>
                          <div
                            className={`text-sm font-bold mt-1 ${
                              tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            <BlurredAmount amount={new Intl.NumberFormat('id-ID').format(tx.amount)} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                        <Dialog open={dialogOpen[tx.id]} onOpenChange={(open) => handleDialogChange(tx.id, open)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <Edit className="h-3.5 w-3.5" />
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
                                transaction={tx}
                                onSuccess={() => handleFormSuccess(tx.id)}
                              />
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
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
                              <AlertDialogAction onClick={() => handleDelete(tx.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8 text-xs">
                  No transactions for this period.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Desktop table layout
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Fund Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         {tx.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{tx.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryName(tx.categoryId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.creditCard ? (
                        <Badge variant="secondary" className="gap-1">
                          <CreditCard className="h-3 w-3" />
                          {tx.creditCard.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <WalletIcon className="h-3 w-3" />
                          {tx.wallet?.name || 'Wallet'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      <BlurredAmount amount={new Intl.NumberFormat('id-ID').format(tx.amount)} />
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog open={dialogOpen[tx.id]} onOpenChange={(open) => handleDialogChange(tx.id, open)}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh]">
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
                              transaction={tx}
                              onSuccess={() => handleFormSuccess(tx.id)}
                            />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                             <Trash2 className="h-4 w-4" />
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
                            <AlertDialogAction onClick={() => handleDelete(tx.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
