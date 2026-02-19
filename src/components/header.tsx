'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CircleUser, LogOut, CirclePlus, Landmark, Tag, CreditCard, Eye, EyeOff } from 'lucide-react';
import Logo from './logo';
import { signOut } from 'next-auth/react';
import { useBlur } from '@/contexts/blur-context';

export default function Header() {
  const { isBlurred, toggleBlur } = useBlur();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <nav className="flex items-center space-x-2">
            <Button asChild size="default" className="gap-2">
              <Link href="/add-transaction">
                <CirclePlus className="h-5 w-5" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleBlur}
              className="relative"
              title={isBlurred ? 'Show amounts' : 'Hide amounts'}
            >
              {isBlurred ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle blur</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallets">
                    <Landmark className="mr-2 h-4 w-4" />
                    <span>Wallets</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/categories">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Categories</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/credit-cards">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Credit Cards</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
