'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Wand2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Wallet, Category, Transaction } from '@/lib/types';
import { getCategorySuggestion, addTransaction, updateTransaction } from '@/app/actions';

const formSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer'], { required_error: 'Please select a transaction type.' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Please enter a positive amount.' }),
  walletId: z.string({ required_error: 'Please select a source wallet.' }),
  destinationWalletId: z.string().optional(),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  date: z.date({ required_error: 'Please select a date.' }),
}).refine(data => {
  // If type is transfer, destinationWalletId is required and must be different from walletId
  if (data.type === 'transfer') {
    return !!data.destinationWalletId && data.destinationWalletId !== data.walletId;
  }
  return true;
}, {
  message: "For transfers, you must select different source and destination wallets",
  path: ["destinationWalletId"]
});

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  transaction?: Transaction;
  onSuccess?: () => void;
}

export default function TransactionForm({ wallets, categories, transaction, onSuccess }: TransactionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSuggestionLoading, startSuggestionTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();

  const isEditMode = !!transaction;

  // Mobile: horizontal radio buttons, Desktop: vertical
  const radioGroupClass = "flex sm:flex-col flex-row sm:space-y-1 sm:space-x-0 space-x-4 space-y-0";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
        ...transaction,
        date: new Date(transaction.date)
    } : {
      type: 'expense',
      description: '',
      amount: 0,
      walletId: '',
      destinationWalletId: '',
      categoryId: '',
      date: new Date(),
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        ...transaction,
        date: new Date(transaction.date)
      });
    }
  }, [transaction, isEditMode, form]);

  const handleSuggestion = async () => {
    const description = form.getValues('description');
    if (!description) {
      form.setError('description', { type: 'manual', message: 'Please enter a description first.' });
      return;
    }

    startSuggestionTransition(async () => {
      const result = await getCategorySuggestion({ description });
      if (result.success && result.data) {
        const suggestedCategory = categories.find(c => c.name.toLowerCase() === result.data.category.toLowerCase());
        if (suggestedCategory) {
          form.setValue('categoryId', suggestedCategory.id, { shouldValidate: true });
          toast({
            title: 'Category Suggested',
            description: `We've selected the "${suggestedCategory.name}" category for you.`,
          });
        } else {
            toast({
                title: 'Suggestion Not Found',
                description: `We suggested "${result.data.category}" but it's not in your list.`,
                variant: 'destructive',
            });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Could not get a suggestion.',
          variant: 'destructive',
        });
      }
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    startSubmittingTransition(async () => {
        const result = isEditMode
            ? await updateTransaction({ ...values, id: transaction.id })
            : await addTransaction(values);

        if (result.success) {
            let transactionTypeText = 'Expense';
            if (values.type === 'income') transactionTypeText = 'Income';
            if (values.type === 'transfer') transactionTypeText = 'Transfer';
            
            toast({
                title: isEditMode ? 'Transaction Updated!' : 'Transaction Added!',
                description: `${transactionTypeText} of ${new Intl.NumberFormat('id-ID').format(values.amount)} recorded.`,
            });
            if (onSuccess) {
              onSuccess();
            } else {
              router.push('/');
            }
        } else {
            toast({
                title: 'Error',
                description: result.error || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className={radioGroupClass}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal">Expense</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal">Income</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="transfer" />
                    </FormControl>
                    <FormLabel className="font-normal">Transfer</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee with friends" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{form.getValues('type') === 'transfer' ? 'Source Wallet' : 'Wallet'}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a wallet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Select onValueChange={field.onChange} value={field.value} className="flex-1 w-full">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                  <Button type="button" variant="outline" size="icon" onClick={handleSuggestion} disabled={isSuggestionLoading} className="w-10 h-10 flex-shrink-0">
                    {isSuggestionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="sr-only">Suggest Category</span>
                  </Button>
                </div>
                <FormDescription className="text-xs sm:text-sm">Can't decide? Type a description and click the magic wand!</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch('type') === 'transfer' && (
          <FormField
            control={form.control}
            name="destinationWalletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination Wallet</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination wallet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets
                      .filter(wallet => wallet.id !== form.getValues('walletId'))
                      .map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the wallet to transfer funds to</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full mb-4 sm:mb-0" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Add Transaction')}
        </Button>
      </form>
    </Form>
  );
}
