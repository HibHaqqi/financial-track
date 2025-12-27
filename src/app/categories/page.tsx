import Header from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import CategoriesClient from '@/components/categories-client';
import { getCategories } from '@/lib/data';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const categories = await getCategories(session.user.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-28 md:pb-8">
        <CategoriesClient categories={categories} userId={session.user.id} />
      </main>
      <MobileBottomNav />
    </div>
  );
}