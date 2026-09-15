"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Bell,
  Briefcase,
  BriefcaseBusiness,
  FileText,
  GitBranch,
  Handshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Send,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { title: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { title: "Вакансии", href: "/vacancies", icon: BriefcaseBusiness },
  { title: "Telegram", href: "/telegram", icon: Send },
  { title: "Отклики", href: "/applications", icon: Briefcase },
  { title: "Оферы", href: "/offers", icon: Handshake },
  { title: "Команды", href: "/teams", icon: UsersRound },
]

const PEOPLE: NavItem[] = [
  { title: "Контакты", href: "/contacts", icon: Users },
]

const SETTINGS: NavItem[] = [
  { title: "Профили", href: "/settings/profile", icon: UserRound },
  { title: "API-ключи", href: "/settings/keys", icon: KeyRound },
  { title: "Воронка", href: "/settings/pipeline", icon: GitBranch },
  { title: "Уведомления", href: "/settings/notifications", icon: Bell },
]

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const email = session?.user?.email ?? ""
  const initials = email
    ? email
        .slice(0, 2)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || "U"
    : "U"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="CV-генератор">
              <Link href="/dashboard">
                <FileText className="text-primary" />
                <span className="font-heading font-medium">CV-генератор</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Навигация" items={NAV} pathname={pathname} />
        <NavGroup label="Люди" items={PEOPLE} pathname={pathname} />
        <NavGroup label="Настройки" items={SETTINGS} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg p-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Выйти"
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
