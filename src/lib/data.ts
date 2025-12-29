import prisma from './prisma';
import type { Transaction, Wallet, Category } from './types';

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactions = await prisma.transaction.findMany({
    where: { wallet: { userId } },
    include: { category: true },
  });
  return transactions;
};

export const getWallets = async (userId: string): Promise<Wallet[]> => {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });
  return wallets;
};

export const getCategories = async (userId?: string): Promise<Category[]> => {
  if (userId) {
    // If userId is provided, filter categories by userId
    const categories = await prisma.category.findMany({
      where: { userId },
    });
    return categories;
  } else {
    // For backward compatibility, return all categories if userId is not provided
    const categories = await prisma.category.findMany();
    return categories;
  }
};

export const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  const newCategory = await prisma.category.create({
    data: category,
  });
  return newCategory;
};

export const updateCategory = async (updatedCategory: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category | null> => {
  const category = await prisma.category.update({
    where: { id: updatedCategory.id },
    data: updatedCategory,
  });
  return category;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  // Check if category is used in any transactions
  const transactionsWithCategory = await prisma.transaction.findFirst({
    where: { categoryId: id },
  });

  if (transactionsWithCategory) {
    throw new Error('Cannot delete category that is used in transactions');
  }

  await prisma.category.delete({ where: { id } });
  return true;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'category' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
  // Handle transfer transactions
  if (transaction.type === 'transfer' && transaction.destinationWalletId) {
    // For transfers, we'll create two transactions:
    // 1. An expense in the source wallet
    const sourceTransaction = await prisma.transaction.create({
      data: {
        amount: transaction.amount,
        description: `Transfer to another wallet: ${transaction.description}`,
        type: 'expense', // Use expense for the source wallet
        date: transaction.date,
        walletId: transaction.walletId,
        categoryId: transaction.categoryId,
      },
      include: { category: true },
    });

    // 2. An income in the destination wallet
    await prisma.transaction.create({
      data: {
        amount: transaction.amount,
        description: `Transfer from another wallet: ${transaction.description}`,
        type: 'income', // Use income for the destination wallet
        date: transaction.date,
        walletId: transaction.destinationWalletId,
        categoryId: transaction.categoryId,
      },
      include: { category: true },
    });

    // Return the source transaction
    return sourceTransaction as Transaction;
  }

  // Handle regular transactions (income/expense)
  const newTransaction = await prisma.transaction.create({
    data: {
      ...transaction,
      type: transaction.type,
    },
    include: { category: true },
  });

  // Auto-detect credit card payments and update credit card limits
  await processCreditCardPayment(newTransaction);

  // Auto-detect credit card purchases and update credit card limits
  await processCreditCardPurchase(newTransaction);

  return newTransaction as Transaction;
};

// Helper function to detect and process credit card payments
const processCreditCardPayment = async (transaction: any) => {
  const { description, amount, type } = transaction;

  // Only process expenses that look like credit card payments
  if (type !== 'expense') return;

  // Pattern 1: "Credit Card Payment - BCA Platinum"
  // Pattern 2: "Payment - BCA Platinum Credit Card"
  // Pattern 3: "Bayar Kartu Kredit - BCA Platinum"
  const ccPaymentPatterns = [
    /credit\s+card\s+payment\s*[-:]\s*(.+)/i,
    /payment\s*[-:]\s*(.+)\s+credit\s+card/i,
    /bayar\s+kartu\s+kredit\s*[-:]\s*(.+)/i,
    /pembayaran\s+kartu\s+kredit\s*[-:]\s*(.+)/i,
  ];

  for (const pattern of ccPaymentPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const cardName = match[1].trim();

      // Find the credit card by name
      const creditCard = await prisma.creditCard.findFirst({
        where: {
          name: {
            contains: cardName,
            mode: 'insensitive',
          },
        },
      });

      if (creditCard) {
        // Decrease the used limit (payment reduces debt)
        await prisma.creditCard.update({
          where: { id: creditCard.id },
          data: {
            usedLimit: {
              decrement: amount,
            },
          },
        });

        // Also try to update active installments for this card
        await updateInstallmentsAfterPayment(creditCard.id, amount);

        console.log(`💳 Credit card payment detected: ${cardName}, Amount: ${amount}`);
        return; // Process only one match
      }
    }
  }
};

// Helper function to update installments after payment
const updateInstallmentsAfterPayment = async (creditCardId: string, paymentAmount: number) => {
  // Get active installments for this card
  const activeInstallments = await prisma.installment.findMany({
    where: {
      creditCardId,
      currentInstallment: {
        lt: prisma.installment.fields.tenor, // Only active installments
      },
    },
    include: {
      creditCard: true,
    },
    orderBy: {
      startDate: 'asc', // Oldest first
    },
  });

  if (activeInstallments.length === 0) return;

  // Distribute payment across installments
  // For simplicity, we'll just update the first matching installment
  // In a real scenario, you might want to distribute proportionally
  const installment = activeInstallments[0];

  // Check if payment matches the monthly installment amount
  if (Math.abs(paymentAmount - installment.monthlyPayment) < 100) {
    // Payment matches! Increment progress
    await prisma.installment.update({
      where: { id: installment.id },
      data: {
        currentInstallment: {
          increment: 1,
        },
      },
    });

    console.log(`📊 Installment updated: ${installment.description} → ${installment.currentInstallment + 1}/${installment.tenor}`);
  }
};

// Helper function to detect and process credit card purchases
const processCreditCardPurchase = async (transaction: any) => {
  const { description, amount, type } = transaction;

  // Only process expenses that look like credit card purchases
  if (type !== 'expense') return;

  // Skip if it's a payment (already handled)
  const isPayment = /credit\s+card\s+payment|bayar\s+kartu\s+kredit|pembayaran\s+kartu\s+kredit/i.test(description);
  if (isPayment) return;

  // Pattern 1: "BCA Platinum - Grocery"
  // Pattern 2: "Purchase at Tokopedia - BCA Platinum"
  // Pattern 3: "Belanja - Mandiri Gold"
  const ccPurchasePatterns = [
    /^(.+?)\s*[-–]\s*.+$/, // "Card Name - Description"
    /purchase\s+at\s+.+?\s*[-–]\s*(.+)/i, // "Purchase at Store - Card Name"
    /belanja\s+.*?[-–]\s*(.+)/i, // "Belanja apa saja - Card Name"
  ];

  for (const pattern of ccPurchasePatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const cardName = match[1].trim();

      // Try to find credit card
      const creditCard = await prisma.creditCard.findFirst({
        where: {
          name: {
            contains: cardName,
            mode: 'insensitive',
          },
        },
      });

      if (creditCard) {
        // Increase the used limit (purchase adds debt)
        await prisma.creditCard.update({
          where: { id: creditCard.id },
          data: {
            usedLimit: {
              increment: amount,
            },
          },
        });

        console.log(`💳 Credit card purchase detected: ${cardName}, Amount: ${amount}`);
        return; // Process only one match
      }
    }
  }
};

export const updateTransaction = async (updatedTransaction: Omit<Transaction, 'category' | 'createdAt' | 'updatedAt'>): Promise<Transaction | null> => {
  const transaction = await prisma.transaction.update({
    where: { id: updatedTransaction.id },
    data: {
      ...updatedTransaction,
      type: updatedTransaction.type === 'transfer' ? 'expense' : updatedTransaction.type, // Convert transfer to expense for DB
    },
    include: { category: true },
  });
  return transaction as Transaction | null;
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  await prisma.transaction.delete({ where: { id } });
  return true;
};

export const addWallet = async (wallet: Omit<Wallet, 'id' | 'userId'> & { userId: string }): Promise<Wallet> => {
  const newWallet = await prisma.wallet.create({
    data: wallet,
  });
  return newWallet;
};

export const updateWallet = async (updatedWallet: Wallet): Promise<Wallet | null> => {
  const wallet = await prisma.wallet.update({
    where: { id: updatedWallet.id },
    data: updatedWallet,
  });
  return wallet;
};

export const deleteWallet = async (id: string): Promise<boolean> => {
  await prisma.transaction.deleteMany({ where: { walletId: id } });
  await prisma.wallet.delete({ where: { id } });
  return true;
};

// ==================== Credit Card Functions ====================

export const getCreditCards = async (userId: string) => {
  const creditCards = await prisma.creditCard.findMany({
    where: { userId },
    include: {
      installments: {
        where: {
          currentInstallment: { lt: prisma.installment.fields.tenor }
        },
        include: { category: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return creditCards;
};

export const getCreditCardById = async (id: string, userId: string) => {
  const creditCard = await prisma.creditCard.findFirst({
    where: { id, userId },
    include: {
      installments: {
        include: { category: true }
      }
    }
  });
  return creditCard;
};

export const addCreditCard = async (creditCard: {
  name: string;
  totalLimit: number;
  billingDate: number;
  userId: string;
}) => {
  const newCreditCard = await prisma.creditCard.create({
    data: creditCard,
  });
  return newCreditCard;
};

export const updateCreditCard = async (id: string, userId: string, updates: {
  name?: string;
  totalLimit?: number;
  usedLimit?: number;
  billingDate?: number;
}) => {
  const creditCard = await prisma.creditCard.update({
    where: { id, userId },
    data: updates,
  });
  return creditCard;
};

export const deleteCreditCard = async (id: string, userId: string): Promise<boolean> => {
  // Check if credit card has active installments
  const activeInstallments = await prisma.installment.findMany({
    where: {
      creditCardId: id,
      currentInstallment: { lt: prisma.installment.fields.tenor }
    }
  });

  if (activeInstallments.length > 0) {
    throw new Error('Cannot delete credit card with active installments');
  }

  await prisma.creditCard.delete({ where: { id, userId } });
  return true;
};

export const updateCreditCardUsedLimit = async (id: string, amount: number): Promise<void> => {
  await prisma.creditCard.update({
    where: { id },
    data: {
      usedLimit: {
        increment: amount
      }
    }
  });
};

// ==================== Installment Functions ====================

export const getInstallments = async (userId: string) => {
  const installments = await prisma.installment.findMany({
    where: {
      creditCard: { userId }
    },
    include: {
      creditCard: true,
      category: true,
      transaction: true
    },
    orderBy: { startDate: 'desc' }
  });
  return installments;
};

export const getActiveInstallments = async (userId: string) => {
  const installments = await prisma.installment.findMany({
    where: {
      creditCard: { userId },
      currentInstallment: { lt: prisma.installment.fields.tenor }
    },
    include: {
      creditCard: true,
      category: true
    },
    orderBy: [{ startDate: 'desc' }]
  });
  return installments;
};

export const getInstallmentById = async (id: string) => {
  const installment = await prisma.installment.findUnique({
    where: { id },
    include: {
      creditCard: true,
      category: true,
      transaction: true
    }
  });
  return installment;
};

export const addInstallment = async (installment: {
  description: string;
  totalAmount: number;
  monthlyPayment: number;
  tenor: number;
  startDate: Date;
  creditCardId: string;
  categoryId: string;
  transactionId?: string;
}) => {
  const { transactionId, ...installmentData } = installment;

  const newInstallment = await prisma.installment.create({
    data: {
      ...installmentData,
      ...(transactionId && {
        transaction: {
          connect: {
            id: transactionId,
          },
        },
      }),
    },
  });
  return newInstallment;
};

export const updateInstallmentProgress = async (id: string): Promise<void> => {
  await prisma.installment.update({
    where: { id },
    data: {
      currentInstallment: {
        increment: 1
      }
    }
  });
};

export const deleteInstallment = async (id: string): Promise<boolean> => {
  await prisma.installment.delete({ where: { id } });
  return true;
};

export const calculateMonthlyInstallmentBurden = async (userId: string): Promise<number> => {
  const activeInstallments = await getActiveInstallments(userId);
  const totalMonthlyBurden = activeInstallments.reduce((sum, installment) => {
    return sum + installment.monthlyPayment;
  }, 0);
  return totalMonthlyBurden;
};