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
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2 } from 'lucide-react';
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


interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
}

export default function RecentTransactions({
  transactions,
  categories,
  wallets,
}: RecentTransactionsProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({});

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'N/A';
  
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
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px] px-4">
            <div className="space-y-3 pb-4">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx) => (
                  <Card key={tx.id} className="p-3 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {tx.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{tx.description}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(tx.date).toLocaleDateString()}
                          </div>
                          <div className="mt-1.5">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(tx.categoryId)}
                            </Badge>
                          </div>
                          <div
                            className={`text-base font-bold mt-1.5 ${
                              tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {new Intl.NumberFormat('id-ID').format(tx.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Dialog open={dialogOpen[tx.id]} onOpenChange={(open) => handleDialogChange(tx.id, open)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Transaction</DialogTitle>
                              <DialogDescription>
                                Update the details of your transaction.
                              </DialogDescription>
                            </DialogHeader>
                            <TransactionForm
                              wallets={wallets}
                              categories={categories}
                              transaction={tx}
                              onSuccess={() => handleFormSuccess(tx.id)}
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600">
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
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8 text-sm">
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
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {new Intl.NumberFormat('id-ID').format(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog open={dialogOpen[tx.id]} onOpenChange={(open) => handleDialogChange(tx.id, open)}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                            <DialogDescription>
                              Update the details of your transaction.
                            </DialogDescription>
                          </DialogHeader>
                          <TransactionForm
                            wallets={wallets}
                            categories={categories}
                            transaction={tx}
                            onSuccess={() => handleFormSuccess(tx.id)}
                          />
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
