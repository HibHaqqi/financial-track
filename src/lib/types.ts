import { Transaction as PrismaTransaction, Wallet as PrismaWallet, Category as PrismaCategory } from '@prisma/client';

export interface Category extends PrismaCategory {}

export interface Wallet extends PrismaWallet {}

export interface Transaction extends Omit<PrismaTransaction, 'type'> {
  type: 'income' | 'expense' | 'transfer';
  category: Category;
}
