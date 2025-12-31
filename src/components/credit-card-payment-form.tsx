'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addTransaction } from '@/app/actions';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Please enter a positive amount.' }),
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  categoryId: z.string().min(1, { message: 'Please select a category.' }),
  date: z.date({ required_error: 'Please select a date.' }),
});

interface CreditCardPaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creditCard: {
    id: string;
    name: string;
    totalLimit: number;
    usedLimit: number;
  };
  wallets: any[];
  categories: any[];
}

export function CreditCardPaymentForm({
  open,
  onClose,
  onSuccess,
  creditCard,
  wallets,
  categories,
}: CreditCardPaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmittingTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      walletId: '',
      categoryId: '',
      date: new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startSubmittingTransition(async () => {
      // Create transaction with automatic payment description
      const transaction = {
        description: `Credit Card Payment - ${creditCard.name}`,
        amount: values.amount,
        type: 'expense' as const,
        date: values.date,
        walletId: values.walletId,
        categoryId: values.categoryId,
        fundSource: 'wallet' as const,
        creditCardId: undefined,
        destinationWalletId: '',
      };

      const result = await addTransaction(transaction);

      if (result.success) {
        toast({
          title: 'Payment Successful! 💳',
          description: `Rp${values.amount.toLocaleString('id-ID')} paid to ${creditCard.name}`,
        });
        form.reset();
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to process payment.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Credit Card
          </DialogTitle>
          <DialogDescription>
            Make a payment to {creditCard.name}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Balance:</span>
            <span className="font-semibold">
              Rp{creditCard.usedLimit.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Available Limit:</span>
            <span className="font-semibold text-green-600">
              Rp{(creditCard.totalLimit - creditCard.usedLimit).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment From</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} (Rp{wallet.balance?.toLocaleString('id-ID') || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Pay Now'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
