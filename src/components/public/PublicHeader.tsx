'use client'

import * as React from 'react'
import Link from 'next/link'
import { Moon, Sun, Menu, Search } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CommandBar } from '@/components/public/CommandBar'

export default function PublicHeader({ locale }: { locale: string }) {
  const { setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex-1 flex justify-start">
          <CommandBar />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="w-9 px-0 border border-transparent hover:border-border/50" />
              }>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login Button */}
            <div className="hidden md:block">
              <Link href={`/${locale}/login`} className={buttonVariants({ variant: "outline", className: "mr-2" })}>
                Log in
              </Link>
              <Link href={`/${locale}/claim`} className={buttonVariants()}>
                Claim Business
              </Link>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger render={<Button variant="ghost" size="icon" className="mr-2" />}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col gap-6">
                  <Link href={`/${locale}`} className="font-bold text-xl pt-4">
                    The Best of Monroe
                  </Link>
                  <div className="flex flex-col space-y-3">
                    <Link href={`/${locale}/directory`} className="text-muted-foreground hover:text-foreground">
                      Directory
                    </Link>
                    <Link href={`/${locale}/events`} className="text-muted-foreground hover:text-foreground">
                      Events
                    </Link>
                    <Link href={`/${locale}/news`} className="text-muted-foreground hover:text-foreground">
                      Local News
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto pb-8">
                    <Link href={`/${locale}/login`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                      Log in
                    </Link>
                    <Link href={`/${locale}/claim`} className={buttonVariants({ className: "w-full" })}>
                      Claim Business
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
