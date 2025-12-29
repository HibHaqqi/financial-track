'use server';

import { categorizeTransaction, CategorizeTransactionInput } from '@/ai/flows/categorize-transaction';
import {
  addTransaction as dbAddTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
  addWallet as dbAddWallet,
  updateWallet as dbUpdateWallet,
  deleteWallet as dbDeleteWallet,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getCategories as dbGetCategories,
  addCreditCard as dbAddCreditCard,
  updateCreditCard as dbUpdateCreditCard,
  deleteCreditCard as dbDeleteCreditCard,
  getCreditCards as dbGetCreditCards,
  addInstallment as dbAddInstallment,
  getActiveInstallments as dbGetActiveInstallments,
  calculateMonthlyInstallmentBurden as dbCalculateMonthlyInstallmentBurden,
} from '@/lib/data';
import type { Transaction, Wallet } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { signIn } from 'next-auth/react';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function register(values: any) {
  try {
    const hashedPassword = await bcrypt.hash(values.password, 10);
    await prisma.user.create({
      data: {
        email: values.email,
        password: hashedPassword,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to register user.' };
  }
}


export async function getCategorySuggestion(input: CategorizeTransactionInput) {
  try {
    const result = await categorizeTransaction(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get category suggestion.' };
  }
}


export async function addTransaction(transaction: Omit<Transaction, 'id' | 'category' | 'createdAt' | 'updatedAt'>) {
    try {
        await dbAddTransaction(transaction);
        revalidatePath('/');
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add transaction.' };
    }
}

export async function updateTransaction(transaction: Omit<Transaction, 'category' | 'createdAt' | 'updatedAt'>) {
    try {
        await dbUpdateTransaction(transaction);
        revalidatePath('/');
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update transaction.' };
    }
}

export async function deleteTransaction(id: string) {
    try {
        await dbDeleteTransaction(id);
        revalidatePath('/');
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to delete transaction.' };
    }
}

export async function addWallet(wallet: Omit<Wallet, 'id'>) {
    try {
        await dbAddWallet(wallet);
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add wallet.' };
    }
}

export async function updateWallet(wallet: Wallet) {
    try {
        await dbUpdateWallet(wallet);
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update wallet.' };
    }
}

export async function deleteWallet(id: string) {
    try {
        await dbDeleteWallet(id);
        revalidatePath('/wallets');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to delete wallet.' };
    }
}

export async function getCategories(userId: string) {
    try {
        const categories = await dbGetCategories(userId);
        return { success: true, data: categories };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to get categories.' };
    }
}

export async function addCategory(category: { name: string; icon: string; userId: string }) {
    try {
        await dbAddCategory(category);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add category.' };
    }
}

export async function updateCategory(category: { id: string; name: string; icon: string; userId: string }) {
    try {
        await dbUpdateCategory(category);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update category.' };
    }
}

export async function deleteCategory(id: string) {
    try {
        await dbDeleteCategory(id);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to delete category.' };
    }
}

// ==================== Credit Card Actions ====================

export async function getCreditCards(userId: string) {
    try {
        const creditCards = await dbGetCreditCards(userId);
        return { success: true, data: creditCards };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to get credit cards.' };
    }
}

export async function addCreditCard(creditCard: { name: string; totalLimit: number; billingDate: number; userId: string }) {
    try {
        await dbAddCreditCard(creditCard);
        revalidatePath('/credit-cards');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add credit card.' };
    }
}

export async function updateCreditCard(id: string, userId: string, updates: { name?: string; totalLimit?: number; billingDate?: number }) {
    try {
        await dbUpdateCreditCard(id, userId, updates);
        revalidatePath('/credit-cards');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update credit card.' };
    }
}

export async function deleteCreditCard(id: string, userId: string) {
    try {
        await dbDeleteCreditCard(id, userId);
        revalidatePath('/credit-cards');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to delete credit card.' };
    }
}

// ==================== Installment Actions ====================

export async function getActiveInstallments(userId: string) {
    try {
        const installments = await dbGetActiveInstallments(userId);
        return { success: true, data: installments };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to get installments.' };
    }
}

export async function addInstallmentWithTransaction(
    installment: {
        description: string;
        totalAmount: number;
        monthlyPayment: number;
        tenor: number;
        startDate: Date;
        creditCardId: string;
        categoryId: string;
    },
    transaction: Omit<Transaction, 'id' | 'category' | 'createdAt' | 'updatedAt'>
) {
    try {
        // Create transaction first
        const createdTransaction = await dbAddTransaction(transaction);

        // Create installment linked to transaction
        await dbAddInstallment({
            ...installment,
            transactionId: createdTransaction.id,
        });

        // Update credit card used limit
        const { updateCreditCardUsedLimit } = await import('@/lib/data');
        await updateCreditCardUsedLimit(installment.creditCardId, installment.totalAmount);

        revalidatePath('/credit-cards');
        revalidatePath('/');
        revalidatePath('/wallets');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add installment with transaction.' };
    }
}

export async function getMonthlyBurden(userId: string) {
    try {
        const burden = await dbCalculateMonthlyInstallmentBurden(userId);
        return { success: true, data: burden };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to calculate monthly burden.' };
    }
}
