import prisma from './prisma';
import type { Transaction, Wallet, Category } from './types';

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactions = await prisma.transaction.findMany({
    where: { wallet: { userId } },
    include: {
      category: true,
      creditCard: true
    },
  });
  return transactions;
};

export const getWallets = async (userId: string): Promise<Wallet[]> => {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    include: {
      transactions: {
        include: {
          category: true,
          creditCard: true
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
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

export const addTransaction = async (transaction: any): Promise<Transaction> => {
  try {
    console.log('🔵 Creating transaction:', {
      type: transaction.type,
      description: transaction.description.substring(0, 50),
      amount: transaction.amount,
      fundSource: transaction.fundSource,
      creditCardId: transaction.creditCardId,
      walletId: transaction.walletId,
    });

    // Extract fundSource and creditCardId before creating transaction (they're not in DB schema)
    const { fundSource, creditCardId, isInstallment, installmentTenor, linkedWalletId, ...transactionData } = transaction;

    // Validate walletId is provided
    if (!transactionData.walletId) {
      throw new Error('Wallet is required for transaction record');
    }

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
    // Use atomic transaction for credit card operations
    const result = await prisma.$transaction(async (tx) => {
      console.log('  → Creating transaction record...');

      // Prepare transaction data with creditCardId if using credit card
      const createData: any = {
        ...transactionData,
        type: transaction.type,
      };

      // If credit card is selected as fund source, store the creditCardId
      if (fundSource === 'credit-card' && creditCardId) {
        createData.creditCardId = creditCardId;
      }

      const newTransaction = await tx.transaction.create({
        data: createData,
        include: { category: true, creditCard: true },
      });

      console.log('  ✅ Transaction record created:', newTransaction.id);
      if (newTransaction.creditCardId) {
        console.log(`     Associated with credit card: ${newTransaction.creditCardId}`);
      }

      // Check if user selected Credit Card as fund source
      if (fundSource === 'credit-card' && creditCardId) {
        // This is a direct credit card purchase (explicitly selected)
        console.log('  → Processing credit card purchase...');
        await processCreditCardPurchaseBySelectionTx(tx, creditCardId, transaction.amount);
        console.log(`💳 Credit card purchase (fund source): ${transaction.amount}`);
      } else {
        // Check if this is a credit card payment first (pattern matching)
        const isPayment = await processCreditCardPaymentTx(tx, newTransaction);

        // If not a payment, check if it's a credit card purchase (pattern matching)
        if (!isPayment) {
          await processCreditCardPurchaseTx(tx, newTransaction);
        }
      }

      return newTransaction;
    });

    console.log('✅ Transaction creation complete');
    return result as Transaction;
  } catch (error) {
    console.error('❌ Error in addTransaction:', error);
    throw error;
  }
};

// Helper function to process credit card purchase when explicitly selected as fund source
const processCreditCardPurchaseBySelectionTx = async (tx: any, creditCardId: string, amount: number) => {
  // Get the credit card
  const creditCard = await tx.creditCard.findUnique({
    where: { id: creditCardId }
  });

  if (!creditCard) {
    throw new Error('Credit card not found');
  }

  // VALIDATION: Check if purchase would exceed limit
  const availableLimit = creditCard.totalLimit - creditCard.usedLimit;
  if (amount > availableLimit) {
    throw new Error(
      `Purchase declined: Amount (Rp${amount.toLocaleString()}) exceeds available credit limit (Rp${availableLimit.toLocaleString()}) for card "${creditCard.name}"`
    );
  }

  // Increase the used limit (purchase adds debt)
  await tx.creditCard.update({
    where: { id: creditCardId },
    data: {
      usedLimit: {
        increment: amount,
      },
    },
  });

  console.log(`💳 Credit card purchase (explicit): ${creditCard.name}`);
  console.log(`   Amount: Rp${amount.toLocaleString()}`);
  console.log(`   Available limit before: Rp${availableLimit.toLocaleString()}`);
  console.log(`   Available limit after: Rp${(availableLimit - amount).toLocaleString()}`);
};

// Helper function to detect and process credit card payments (with transaction context)
const processCreditCardPaymentTx = async (tx: any, transaction: any): Promise<boolean> => {
  const { description, amount, type } = transaction;

  // Only process expenses that look like credit card payments
  if (type !== 'expense') return false;

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
      const creditCard = await tx.creditCard.findFirst({
        where: {
          name: {
            contains: cardName,
            mode: 'insensitive',
          },
        },
      });

      if (creditCard) {
        // Decrease the used limit (payment reduces debt)
        await tx.creditCard.update({
          where: { id: creditCard.id },
          data: {
            usedLimit: {
              decrement: amount,
            },
          },
        });

        // Also try to update active installments for this card
        await updateInstallmentsAfterPaymentTx(tx, creditCard.id, amount);

        console.log(`💳 Credit card payment detected: ${cardName}, Amount: ${amount}`);
        return true; // Payment detected and processed
      }
    }
  }

  return false; // No payment pattern matched
};

// Helper function to update installments after payment (with transaction context)
const updateInstallmentsAfterPaymentTx = async (tx: any, creditCardId: string, paymentAmount: number) => {
  // Get active installments for this card
  const activeInstallments = await tx.installment.findMany({
    where: {
      creditCardId,
      currentInstallment: {
        lt: tx.installment.fields.tenor, // Only active installments
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
    await tx.installment.update({
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

// Helper function to detect and process credit card purchases (with transaction context)
const processCreditCardPurchaseTx = async (tx: any, transaction: any) => {
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
      const creditCard = await tx.creditCard.findFirst({
        where: {
          name: {
            contains: cardName,
            mode: 'insensitive',
          },
        },
      });

      if (creditCard) {
        // VALIDATION: Check if purchase would exceed limit
        const availableLimit = creditCard.totalLimit - creditCard.usedLimit;
        if (amount > availableLimit) {
          throw new Error(
            `Purchase declined: Amount (Rp${amount.toLocaleString()}) exceeds available credit limit (Rp${availableLimit.toLocaleString()}) for card "${creditCard.name}"`
          );
        }

        // Increase the used limit (purchase adds debt)
        await tx.creditCard.update({
          where: { id: creditCard.id },
          data: {
            usedLimit: {
              increment: amount,
            },
          },
        });

        console.log(`💳 Credit card purchase detected: ${cardName}, Amount: ${amount}`);
        console.log(`   Available limit before: Rp${availableLimit.toLocaleString()}`);
        console.log(`   Available limit after: Rp${(availableLimit - amount).toLocaleString()}`);
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
  // Get transaction details with credit card info
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      creditCard: true
    }
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  await prisma.$transaction(async (tx) => {
    // If this transaction is linked to an installment, delete the installment too
    if (transaction.installmentId) {
      console.log(`🗑️ Deleting transaction linked to installment: ${transaction.description}`);
      await deleteInstallment(transaction.installmentId);
    } else if (transaction.creditCardId && transaction.type === 'expense') {
      // If this transaction was made with a credit card, restore the credit limit
      const creditCard = await tx.creditCard.findUnique({
        where: { id: transaction.creditCardId }
      });

      if (creditCard) {
        console.log(`💳 Restoring credit limit for deleted transaction:`);
        console.log(`   Credit Card: ${creditCard.name}`);
        console.log(`   Amount to restore: Rp${transaction.amount.toLocaleString()}`);
        console.log(`   Used limit before: Rp${creditCard.usedLimit.toLocaleString()}`);

        await tx.creditCard.update({
          where: { id: transaction.creditCardId },
          data: {
            usedLimit: {
              decrement: transaction.amount
            }
          }
        });

        console.log(`   Used limit after: Rp${Math.max(0, creditCard.usedLimit - transaction.amount).toLocaleString()}`);
      }
    }

    // Delete the transaction
    await tx.transaction.delete({ where: { id } });
  });

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
  console.log(`🔍 Attempting to delete credit card: ${id}`);

  // Check if credit card has ANY installments (active or completed)
  const allInstallments = await prisma.installment.findMany({
    where: { creditCardId: id },
    include: { creditCard: true }
  });

  console.log(`📊 Found ${allInstallments.length} installment(s) for this credit card`);

  if (allInstallments.length > 0) {
    const activeCount = allInstallments.filter(i => i.currentInstallment < i.tenor).length;
    const completedCount = allInstallments.filter(i => i.currentInstallment >= i.tenor).length;

    console.log(`   • Active: ${activeCount}`);
    console.log(`   • Completed: ${completedCount}`);

    throw new Error(
      `Cannot delete credit card with ${allInstallments.length} installment(s).\n` +
      `• Active: ${activeCount}\n` +
      `• Completed: ${completedCount}\n\n` +
      `Please delete all installments first before deleting the credit card.`
    );
  }

  await prisma.creditCard.delete({ where: { id, userId } });

  console.log(`🗑️ Credit card deleted successfully: ${id}`);

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
  linkedWalletId: string;
}) => {
  const newInstallment = await prisma.installment.create({
    data: installment,
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
  // Get installment details before deleting
  const installment = await prisma.installment.findUnique({
    where: { id },
    include: { creditCard: true }
  });

  if (!installment) {
    throw new Error('Installment not found');
  }

  // Count how many monthly payment transactions were actually created by the worker
  const paymentTransactions = await prisma.transaction.count({
    where: {
      installmentId: id,
      description: { contains: 'Installment payment:' }
    }
  });

  // Restore credit card used limit (reverse the initial block + any payments made)
  // Initial block: totalAmount (when installment was created)
  // Each monthly payment: -monthlyPayment (reduces used limit)
  // So we need to restore: totalAmount - (monthlyPayment × paymentsMade)
  const amountToRestore = installment.totalAmount - (installment.monthlyPayment * paymentTransactions);

  await prisma.$transaction(async (tx) => {
    // Delete all transactions linked to this installment
    await tx.transaction.deleteMany({
      where: { installmentId: id }
    });

    // Restore credit card limit
    await tx.creditCard.update({
      where: { id: installment.creditCardId },
      data: {
        usedLimit: {
          decrement: amountToRestore
        }
      }
    });

    // Delete the installment
    await tx.installment.delete({ where: { id } });
  });

  console.log(`🗑️ Installment deleted: ${installment.description}`);
  console.log(`   Total: Rp${installment.totalAmount.toLocaleString()}`);
  console.log(`   Monthly payments made: ${paymentTransactions}`);
  console.log(`   Restored credit card limit: Rp${amountToRestore.toLocaleString()}`);
  console.log(`   Deleted ${paymentTransactions} related transactions`);

  return true;
};

export const calculateMonthlyInstallmentBurden = async (userId: string): Promise<number> => {
  const activeInstallments = await getActiveInstallments(userId);
  const totalMonthlyBurden = activeInstallments.reduce((sum, installment) => {
    return sum + installment.monthlyPayment;
  }, 0);
  return totalMonthlyBurden;
};