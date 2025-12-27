import DashboardClient from '@/components/dashboard-client';
import { getTransactions, getWallets, getCategories } from '@/lib/data';
import Header from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

export default async function DashboardPage() {
  // In a real application, you would fetch this data based on the logged-in user.
  const transactions = await getTransactions();
  const wallets = await getWallets();
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 sm:pb-6 md:pb-8">
        <DashboardClient
          transactions={transactions}
          wallets={wallets}
          categories={categories}
        />
      </main>
      <MobileBottomNav />
    </div>
  );
}