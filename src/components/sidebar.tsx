'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Home, ShoppingBag, Link as LinkIcon, Key, ScrollText, Users, Settings, LogOut, ChevronUp, Palette, Package, Database, FileText, ClipboardList, ShieldAlert, Contact, Ticket, Shield, Zap, Workflow, BarChart3, ChevronDown, Sparkles } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface AppSidebarProps {
  user: {
    name: string
    email: string
    role: string
    isSuperAdmin: boolean
  }
  locale: string
}

interface NavItem {
  title: string
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subItems?: { title: string; url: string; icon: any }[]
}

export function AppSidebar({ user, locale }: AppSidebarProps) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const navItems: NavItem[] = [
    { title: t('dashboard'), url: `/${locale}/app`, icon: Home },
    { title: t('pos'), url: `/${locale}/app/pos`, icon: ShoppingBag },
    { title: t('crm'), url: `/${locale}/app/crm`, icon: Contact },
    { title: t('inventory'), url: `/${locale}/app/inventory`, icon: Package },
    {
      title: 'Business Intelligence',
      url: '#',
      icon: BarChart3,
      subItems: [
        { title: 'AI Architect', url: `/${locale}/app/architect`, icon: Sparkles },
        { title: t('forms'), url: `/${locale}/app/eforms`, icon: ClipboardList },
        { title: t('automations'), url: `/${locale}/app/automations`, icon: Zap },
        { title: 'Workflows', url: `/${locale}/app/workflows`, icon: Workflow },
        { title: 'Analytics', url: `/${locale}/app/analytics`, icon: BarChart3 },
      ],
    },
    { title: t('invoices'), url: `/${locale}/app/invoices`, icon: FileText },
    { title: t('vault'), url: `/${locale}/app/vault`, icon: Database },
    { title: t('directory'), url: `/${locale}/app/directory`, icon: ScrollText },
    { title: t('links'), url: `/${locale}/app/links`, icon: LinkIcon },
    { title: t('keyrings'), url: `/${locale}/app/keyrings`, icon: Key },
    { title: t('team'), url: `/${locale}/app/users`, icon: Users },
    { title: t('theme'), url: `/${locale}/app/theme`, icon: Palette },
    { title: t('settings'), url: `/${locale}/app/settings`, icon: Settings },
  ]

  // Add Audit Logs to BI for owners
  if (user.role === 'owner') {
    const bi = navItems.find((i) => i.title === 'Business Intelligence')
    if (bi && bi.subItems) {
      bi.subItems.push({ title: t('audit_logs'), url: `/${locale}/app/users/audit-logs`, icon: Shield })
    }
  }

  // Add Admin Panel for super-admins
  if (user.isSuperAdmin) {
    navItems.push({ title: t('admin'), url: `/${locale}/admin`, icon: ShieldAlert })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isActive = (url: string) => {
    if (url === '#' || !url) return false
    if (url === `/${locale}/app`) return pathname === url
    return pathname.startsWith(url)
  }

  const isGroupActive = (item: NavItem) => {
    if (!item.subItems) return isActive(item.url)
    return item.subItems.some((sub) => isActive(sub.url))
  }

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    )
  }

  return (
    <Sidebar className="border-r border-white/5">
      <SidebarContent className="bg-[oklch(0.105_0.027_265)]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-4">
            Best of Monroe
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const hasSubItems = !!item.subItems?.length
                const active = isActive(item.url) || isGroupActive(item)
                const isOpen = openGroups.includes(item.title) || (active && !openGroups.includes(item.title) && hasSubItems)

                if (hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(item.title)}
                        className={`
                          relative transition-all duration-200
                          ${active 
                            ? 'bg-white/10 text-white font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r before:bg-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          }
                        `}
                      >
                        <item.icon className="shrink-0" />
                        <span>{item.title}</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                      
                      {isOpen && (
                        <SidebarMenuSub>
                          {item.subItems?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                isActive={isActive(subItem.url)}
                                className={`
                                  transition-all duration-200
                                  ${isActive(subItem.url) 
                                    ? 'text-white font-medium' 
                                    : 'text-muted-foreground hover:text-foreground'
                                  }
                                `}
                                onClick={() => router.push(subItem.url)}
                              >
                                <subItem.icon className="shrink-0 w-3.5 h-3.5" />
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.url)}
                      isActive={isActive(item.url)}
                      className={`
                        relative transition-all duration-200
                        ${isActive(item.url)
                          ? 'bg-white/10 text-white font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r before:bg-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }
                      `}
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[oklch(0.105_0.027_265)] border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-14 w-full items-center gap-3 px-3 hover:bg-white/5 rounded-md transition-colors outline-none cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                  </div>
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] glass border-white/10">
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {user.role}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {tAuth('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
