'use client'

import * as React from 'react'
import Link from 'next/link'
import { Moon, Sun, Menu } from 'lucide-react'
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
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { NavigationButtons } from '@/components/public/NavigationButtons'

export default function PublicHeader({ locale }: { locale: string }) {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-white/[0.06]">
      <div className="flex h-12 items-center justify-between px-4 md:px-6 gap-4">
        {/* Left: Nav buttons + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <NavigationButtons />
          <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />
          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Center: Command bar */}
        <div className="flex-1 flex justify-center max-w-md">
          <CommandBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 mr-1">
            <Link href={`/${locale}/council-meetings`} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-xs h-7" })}>
              City Council
            </Link>
          </div>

          {/* Theme Toggle — deferred to avoid base-ui hydration ID mismatch */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="h-7 w-7 px-0 border border-transparent hover:border-border/50" />
              }>
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Login Button */}
          <div className="hidden md:flex items-center gap-1">
            <Link href={`/${locale}/login`} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-xs h-7" })}>
              Log in
            </Link>
            <Link href={`/${locale}/claim`} className={buttonVariants({ size: "sm", className: "text-xs h-7" })}>
              Claim
            </Link>
          </div>

          {/* Mobile Nav — deferred to avoid base-ui hydration ID mismatch */}
          <div className="md:hidden">
            {mounted && (
              <Sheet>
                <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-7 w-7" })}>
                  <Menu className="h-4 w-4" />
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
                    <Link href={`/${locale}/council-meetings`} className="text-muted-foreground hover:text-foreground">
                      City Council Meetings
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
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
