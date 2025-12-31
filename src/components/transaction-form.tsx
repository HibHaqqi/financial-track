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
import { getCategorySuggestion, addTransaction, updateTransaction, addInstallmentWithTransaction } from '@/app/actions';

const formSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer'], { required_error: 'Please select a transaction type.' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Please enter a positive amount.' }),
  fundSource: z.enum(['wallet', 'credit-card'], { required_error: 'Please select a fund source.' }),
  walletId: z.string().optional(),
  creditCardId: z.string().optional(),
  destinationWalletId: z.string().optional(),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  date: z.date({ required_error: 'Please select a date.' }),
  isInstallment: z.boolean().optional(),
  installmentTenor: z.coerce.number().optional(),
  linkedWalletId: z.string().optional(),
}).refine(data => {
  // If fundSource is wallet, walletId is required
  if (data.fundSource === 'wallet') {
    return !!data.walletId;
  }
  // If fundSource is credit-card, creditCardId is required
  if (data.fundSource === 'credit-card') {
    return !!data.creditCardId;
  }
  return true;
}, {
  message: "Please select the appropriate fund source",
  path: ["fundSource"]
}).refine(data => {
  // If type is transfer, destinationWalletId is required and must be different from walletId
  if (data.type === 'transfer') {
    return !!data.destinationWalletId && data.destinationWalletId !== data.walletId;
  }
  return true;
}, {
  message: "For transfers, you must select different source and destination wallets",
  path: ["destinationWalletId"]
}).refine(data => {
  // If isInstallment is true, creditCardId, tenor, and linkedWalletId must be provided
  if (data.isInstallment) {
    return !!data.creditCardId && !!data.installmentTenor && data.installmentTenor > 0 && !!data.linkedWalletId;
  }
  return true;
}, {
  message: "For installments, please select a credit card, specify tenor, and choose a wallet for monthly payments",
  path: ["linkedWalletId"]
});

interface CreditCard {
  id: string;
  name: string;
  totalLimit: number;
  usedLimit: number;
  billingDate: number;
}

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  creditCards?: CreditCard[];
  transaction?: Transaction;
  onSuccess?: () => void;
}

export default function TransactionForm({ wallets, categories, creditCards = [], transaction, onSuccess }: TransactionFormProps) {
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
      date: new Date(transaction.date),
      fundSource: transaction.creditCardId ? 'credit-card' : 'wallet',
    } : {
      type: 'expense',
      description: '',
      amount: 0,
      fundSource: 'wallet',
      walletId: '',
      creditCardId: '',
      destinationWalletId: '',
      categoryId: '',
      date: new Date(),
      isInstallment: false,
      installmentTenor: 0,
      linkedWalletId: '',
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        ...transaction,
        date: new Date(transaction.date),
        fundSource: transaction.creditCardId ? 'credit-card' : 'wallet',
      });
    }
  }, [transaction, isEditMode, form]);

  // Auto-select first credit card when fund source changes to credit-card
  const fundSource = form.watch('fundSource');
  useEffect(() => {
    const currentCreditCardId = form.getValues('creditCardId');

    if (fundSource === 'credit-card' && !currentCreditCardId && creditCards.length > 0) {
      form.setValue('creditCardId', creditCards[0].id);
    }
  }, [fundSource]);

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
      let result;

      // Handle installment transactions
      if (!isEditMode && values.isInstallment && values.creditCardId && values.installmentTenor && values.linkedWalletId) {
        // Calculate monthly payment
        const monthlyPayment = Math.round(values.amount / values.installmentTenor);

        result = await addInstallmentWithTransaction(
          {
            description: values.description,
            totalAmount: values.amount,
            monthlyPayment: monthlyPayment,
            tenor: values.installmentTenor,
            startDate: values.date,
            creditCardId: values.creditCardId,
            categoryId: values.categoryId,
            linkedWalletId: values.linkedWalletId,
          },
          {
            description: values.description + (values.installmentTenor ? ` (${values.installmentTenor} months)` : ''),
            amount: values.amount,
            type: values.type,
            date: values.date,
            walletId: values.walletId,
            categoryId: values.categoryId,
            destinationWalletId: values.destinationWalletId,
          }
        );
      } else {
        // Handle regular transactions
        result = isEditMode
          ? await updateTransaction({ ...values, id: transaction.id })
          : await addTransaction(values);
      }

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

        {/* Fund Source Selection - Only for expenses */}
        {form.watch('type') === 'expense' && (
          <FormField
            control={form.control}
            name="fundSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fund Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="wallet">💵 Bank Wallet / Cash</SelectItem>
                    <SelectItem value="credit-card">💳 Credit Card</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Where is this money coming from?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Wallet field - Always shown (required for record-keeping) */}
          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.getValues('type') === 'transfer' ? 'Source Wallet' :
                   form.getValues('fundSource') === 'credit-card' ? 'Wallet for Record' : 'Wallet'}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                {form.watch('fundSource') === 'credit-card' && (
                  <FormDescription>
                    Required for record-keeping (transaction won't affect this wallet balance)
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Credit Card Selection - Show when fundSource is credit-card */}
          {form.watch('fundSource') === 'credit-card' && form.watch('type') === 'expense' && (
            <FormField
              control={form.control}
              name="creditCardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Card</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit card" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This will increase your credit card used limit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex-1 w-full">
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  </div>
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

        {/* Installment Option - Only for expense type */}
        {form.watch('type') === 'expense' && creditCards.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <FormField
              control={form.control}
              name="isInstallment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue('creditCardId', '');
                          form.setValue('installmentTenor', 0);
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Pay with Credit Card Installment
                    </FormLabel>
                    <FormDescription>
                      Split this payment into monthly installments
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('isInstallment') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="creditCardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Card</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select credit card" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name}
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
                  name="installmentTenor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installment Period (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 12"
                          min="1"
                          max="60"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {field.value > 0 && form.watch('amount') > 0 &&
                          `Monthly: ${new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(form.watch('amount') / field.value)}`
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedWalletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Source Wallet</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select wallet for autopay" />
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
                      <FormDescription className="text-xs">
                        Wallet for monthly autopay
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
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
