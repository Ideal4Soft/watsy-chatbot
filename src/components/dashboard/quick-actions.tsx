"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  MessageSquare, 
  Smartphone, 
  Bot, 
  BarChart3, 
  Settings,
  Users,
  FileText
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  variant?: 'default' | 'secondary' | 'outline'
  color?: string
}

interface QuickActionsProps {
  userRole: string
  className?: string
}

export function QuickActions({ userRole, className }: QuickActionsProps) {
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const baseActions: QuickAction[] = [
    {
      title: "Add Device",
      description: "Connect new WhatsApp device",
      icon: Plus,
      href: "/devices",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Send Message",
      description: "Send WhatsApp message",
      icon: MessageSquare,
      href: "/messages",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Manage Devices",
      description: "View and manage devices",
      icon: Smartphone,
      href: "/devices",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Create Chatbot",
      description: "Build automated responses",
      icon: Bot,
      href: "/chatbots",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ]

  const adminActions: QuickAction[] = [
    {
      title: "Analytics",
      description: "View detailed reports",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Manage Users",
      description: "User administration",
      icon: Users,
      href: "/admin/users",
      color: "bg-pink-500 hover:bg-pink-600"
    }
  ]

  const superAdminActions: QuickAction[] = [
    {
      title: "System Settings",
      description: "Configure system",
      icon: Settings,
      href: "/admin/system",
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      title: "Audit Logs",
      description: "View system logs",
      icon: FileText,
      href: "/admin/audit-logs",
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ]

  const allActions = [
    ...baseActions,
    ...(isAdmin ? adminActions : []),
    ...(isSuperAdmin ? superAdminActions : [])
  ]

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allActions.map((action, index) => {
            const Icon = action.icon
            
            const ActionButton = (
              <Button
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-all",
                  action.color && "border-0 text-white",
                  action.color
                )}
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            )

            if (action.href) {
              return (
                <Link key={index} href={action.href}>
                  {ActionButton}
                </Link>
              )
            }

            return <div key={index}>{ActionButton}</div>
          })}
        </div>
      </CardContent>
    </Card>
  )
}
