'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Wallet, Tag, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/add-transaction',
      label: 'Add',
      icon: Plus,
    },
    {
      href: '/wallets',
      label: 'Wallets',
      icon: Wallet,
    },
    {
      href: '/categories',
      label: 'Categories',
      icon: Tag,
    },
    {
      href: '/credit-cards',
      label: 'Cards',
      icon: CreditCard,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px));
        }
      `}</style>
      <div className="grid h-14 grid-cols-5 items-center max-w-screen-2xl mx-auto safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors min-h-[44px]',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                isActive && 'text-primary'
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
