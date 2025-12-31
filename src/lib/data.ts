import prisma from './prisma';
import type { Transaction, Wallet, Category } from './types';

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactions = await prisma.transaction.findMany({
    where: { wallet: { userId } },
    include: {
      category: true,
      creditCard: true,
      wallet: true
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
        // IMPORTANT: usedLimit should never go negative (can't pay more than you owe)
        const newUsedLimit = Math.max(0, creditCard.usedLimit - amount);
        await tx.creditCard.update({
          where: { id: creditCard.id },
          data: {
            usedLimit: newUsedLimit,
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

export const updateTransaction = async (updatedTransaction: Omit<Transaction, 'category' | 'createdAt' | 'updatedAt'> & { fundSource?: string }): Promise<Transaction | null> => {
  // Get the old transaction first
  const oldTransaction = await prisma.transaction.findUnique({
    where: { id: updatedTransaction.id },
    include: { creditCard: true }
  });

  if (!oldTransaction) {
    throw new Error('Transaction not found');
  }

  // Process the update within a transaction to handle credit card changes
  const result = await prisma.$transaction(async (tx) => {
    // REVERSE OLD TRANSACTION EFFECTS
    // If old transaction was using a credit card, restore the credit limit
    if (oldTransaction.creditCardId && oldTransaction.type === 'expense') {
      // Check if old transaction was a PAYMENT or PURCHASE
      const isOldPayment = /credit\s+card\s+payment|bayar\s+kartu\s+kredit|pembayaran\s+kartu\s+kredit/i.test(oldTransaction.description || '');

      const oldCreditCard = await tx.creditCard.findUnique({
        where: { id: oldTransaction.creditCardId }
      });

      if (oldCreditCard) {
        if (isOldPayment) {
          // Reversing a PAYMENT: Need to INCREASE usedLimit (undo the payment effect)
          console.log(`💳 Reversing credit card payment (editing transaction):`);
          console.log(`   Credit Card: ${oldCreditCard.name}`);
          console.log(`   Payment amount to reverse: Rp${oldTransaction.amount.toLocaleString()}`);

          await tx.creditCard.update({
            where: { id: oldTransaction.creditCardId },
            data: {
              usedLimit: {
                increment: oldTransaction.amount  // Add back the debt
              }
            }
          });
        } else {
          // Reversing a PURCHASE: Need to DECREASE usedLimit (restore the credit limit)
          console.log(`💳 Restoring credit limit for edited purchase transaction:`);
          console.log(`   Credit Card: ${oldCreditCard.name}`);
          console.log(`   Purchase amount to restore: Rp${oldTransaction.amount.toLocaleString()}`);

          await tx.creditCard.update({
            where: { id: oldTransaction.creditCardId },
            data: {
              usedLimit: {
                decrement: oldTransaction.amount  // Remove the debt
              }
            }
          });
        }
      }
    }

    // APPLY NEW TRANSACTION EFFECTS
    // If new transaction uses credit card, process it
    if (updatedTransaction.fundSource === 'credit-card' && updatedTransaction.creditCardId && updatedTransaction.type === 'expense') {
      const creditCard = await tx.creditCard.findUnique({
        where: { id: updatedTransaction.creditCardId }
      });

      if (!creditCard) {
        throw new Error('Credit card not found');
      }

      // VALIDATION: Check if purchase would exceed limit
      const availableLimit = creditCard.totalLimit - creditCard.usedLimit;
      if (updatedTransaction.amount > availableLimit) {
        throw new Error(
          `Purchase declined: Amount (Rp${updatedTransaction.amount.toLocaleString()}) exceeds available credit limit (Rp${availableLimit.toLocaleString()}) for card "${creditCard.name}"`
        );
      }

      // Increase the used limit (purchase adds debt)
      await tx.creditCard.update({
        where: { id: updatedTransaction.creditCardId },
        data: {
          usedLimit: {
            increment: updatedTransaction.amount
          }
        }
      });

      console.log(`💳 Credit card purchase (fund source): Rp${updatedTransaction.amount.toLocaleString()}`);
    }

    // Update the transaction record
    // Extract only the fields that exist in the database schema
    const { fundSource, ...transactionData } = updatedTransaction as any;

    // If fund source is wallet, clear the creditCardId
    // If fund source is credit-card, ensure creditCardId is set
    const finalData = {
      ...transactionData,
      type: updatedTransaction.type === 'transfer' ? 'expense' : updatedTransaction.type, // Convert transfer to expense for DB
    };

    if (fundSource === 'wallet') {
      finalData.creditCardId = null;
    }

    const transaction = await tx.transaction.update({
      where: { id: updatedTransaction.id },
      data: finalData,
      include: { category: true },
    });

    return transaction;
  });

  return result as Transaction | null;
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
    } else if (transaction.type === 'expense') {
      // Check if this is a credit card PAYMENT or PURCHASE
      const isPayment = /credit\s+card\s+payment\s*[-:]\s*(.+)|bayar\s+kartu\s+kredit\s*[-:]\s*(.+)|pembayaran\s+kartu\s+kredit\s*[-:]\s*(.+)/i.test(transaction.description);

      let creditCard = null;

      // If transaction has a creditCardId, use it
      if (transaction.creditCardId) {
        creditCard = await tx.creditCard.findUnique({
          where: { id: transaction.creditCardId }
        });
      } else if (isPayment) {
        // Payment transactions might not have creditCardId, extract card name from description
        const match = transaction.description.match(/credit\s+card\s+payment\s*[-:]\s*(.+)|bayar\s+kartu\s+kredit\s*[-:]\s*(.+)|pembayaran\s+kartu\s+kredit\s*[-:]\s*(.+)/i);
        if (match && match[1]) {
          const cardName = match[1].trim();
          creditCard = await tx.creditCard.findFirst({
            where: {
              name: {
                contains: cardName,
                mode: 'insensitive',
              },
            },
          });
        }
      }

      if (creditCard) {
        if (isPayment) {
          // Deleting a PAYMENT transaction: Need to INCREASE usedLimit (undo the payment, bring back debt)
          console.log(`💳 Undoing credit card payment (deleted transaction):`);
          console.log(`   Credit Card: ${creditCard.name}`);
          console.log(`   Payment amount: Rp${transaction.amount.toLocaleString()}`);
          console.log(`   Used limit before: Rp${creditCard.usedLimit.toLocaleString()}`);

          await tx.creditCard.update({
            where: { id: creditCard.id },
            data: {
              usedLimit: {
                increment: transaction.amount  // Add back the debt
              }
            }
          });

          console.log(`   Used limit after: Rp${(creditCard.usedLimit + transaction.amount).toLocaleString()}`);
        } else {
          // Deleting a PURCHASE transaction: Need to DECREASE usedLimit (restore the credit limit)
          console.log(`💳 Restoring credit limit for deleted purchase transaction:`);
          console.log(`   Credit Card: ${creditCard.name}`);
          console.log(`   Purchase amount: Rp${transaction.amount.toLocaleString()}`);
          console.log(`   Used limit before: Rp${creditCard.usedLimit.toLocaleString()}`);

          await tx.creditCard.update({
            where: { id: creditCard.id },
            data: {
              usedLimit: {
                decrement: transaction.amount  // Remove the debt
              }
            }
          });

          console.log(`   Used limit after: Rp${Math.max(0, creditCard.usedLimit - transaction.amount).toLocaleString()}`);
        }
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

  // Calculate usedLimit for each card from actual transactions (NOT from stored value)
  const cardsWithCalculatedLimit = await Promise.all(
    creditCards.map(async (card) => {
      // Get purchases (transactions with this creditCardId)
      const purchaseTransactions = await prisma.transaction.findMany({
        where: {
          creditCardId: card.id,
          type: 'expense',
        },
      });

      // Get potential payments (expenses without creditCardId)
      const allExpensesWithoutCard = await prisma.transaction.findMany({
        where: {
          creditCardId: null,
          type: 'expense',
        },
      });

      // Filter to find payments for this specific card (by description matching)
      const paymentPatterns = [
        new RegExp(`credit\\s+card\\s+payment\\s*[-:]\\s*${card.name}`, 'i'),
        new RegExp(`bayar\\s+kartu\\s+kredit\\s*[-:]\\s*${card.name}`, 'i'),
        new RegExp(`pembayaran\\s+kartu\\s+kredit\\s*[-:]\\s*${card.name}`, 'i'),
      ];

      const paymentTransactions = allExpensesWithoutCard.filter(t =>
        paymentPatterns.some(pattern => pattern.test(t.description))
      );

      // Calculate: Purchases ADD to usedLimit, Payments SUBTRACT from usedLimit
      let usedLimit = 0;

      // Add all purchases
      for (const t of purchaseTransactions) {
        usedLimit += t.amount;
      }

      // Subtract all payments
      for (const t of paymentTransactions) {
        usedLimit -= t.amount;
      }

      // Ensure usedLimit never goes negative
      usedLimit = Math.max(0, usedLimit);

      return {
        ...card,
        usedLimit, // Override with calculated value
      };
    })
  );

  return cardsWithCalculatedLimit;
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