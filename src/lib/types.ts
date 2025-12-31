import { Transaction as PrismaTransaction, Wallet as PrismaWallet, Category as PrismaCategory, CreditCard as PrismaCreditCard } from '@prisma/client';

export interface Category extends PrismaCategory {}

export interface Wallet extends PrismaWallet {}

export interface CreditCard extends PrismaCreditCard {}

export interface Transaction extends Omit<PrismaTransaction, 'type'> {
  type: 'income' | 'expense' | 'transfer';
  category: Category;
  creditCard?: CreditCard | null;
  wallet?: Wallet;
}
