// src/components/layout/user-nav.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { User, Settings, LifeBuoy, LogOut } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user;

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar text
  const avatarText = user?.name ? getInitials(user.name) : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" size={undefined}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} className={undefined} />
            <AvatarFallback className={undefined}>{avatarText}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal" inset={undefined}>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={undefined} />
        <DropdownMenuGroup>
          <DropdownMenuItem className={undefined} inset={undefined}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={undefined} inset={undefined}>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className={undefined} inset={undefined}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className={undefined} />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className={undefined} inset={undefined}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
