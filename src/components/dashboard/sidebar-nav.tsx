"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Smartphone,
  MessageSquare,
  Bot,
  BarChart3,
  Users,
  Settings,
  FileText,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
}

interface SidebarNavProps {
  userRole: string
  className?: string
}

export function SidebarNav({ userRole, className }: SidebarNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const baseNavItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Devices',
      href: '/devices',
      icon: Smartphone,
      badge: '4'
    },
    {
      title: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      badge: 'New'
    },
    {
      title: 'Chatbots',
      href: '/chatbots',
      icon: Bot
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3
    }
  ]

  const adminNavItems: NavItem[] = [
    {
      title: 'Administration',
      href: '/admin',
      icon: Settings,
      children: [
        {
          title: 'Users',
          href: '/admin/users',
          icon: Users
        },
        {
          title: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3
        }
      ]
    }
  ]

  const superAdminNavItems: NavItem[] = [
    {
      title: 'System',
      href: '/admin/system',
      icon: Settings,
      children: [
        {
          title: 'Settings',
          href: '/admin/system/settings',
          icon: Settings
        },
        {
          title: 'Audit Logs',
          href: '/admin/audit-logs',
          icon: FileText
        }
      ]
    }
  ]

  const allNavItems = [
    ...baseNavItems,
    ...(isAdmin ? adminNavItems : []),
    ...(isSuperAdmin ? superAdminNavItems : [])
  ]

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.title)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                level > 0 && "ml-4",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                level > 0 && "ml-4",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent 
                key={child.href} 
                item={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Watsy</h2>
                <p className="text-xs text-muted-foreground">ChatBot</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {allNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>Version 1.0.0</p>
              <p>© 2024 Ideal4Soft</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
