"use client"

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Plus,
  ChevronDown,
  ChevronUp,
  User2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/Auth/AuthContext"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TaskForm } from "@/components/task-form"

// Main menu items.
const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    authRequired: true,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    authRequired: true,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    authRequired: true,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    authRequired: true,
  },
]

// Projects/categories for a collapsible group - now with category query params
const projects = [
  { name: "Work", category: "Work", icon: Home },
  { name: "Personal", category: "Personal", icon: Inbox },
  { name: "Study", category: "Study", icon: Search },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleTaskCreated = () => {
    setIsFormOpen(false)
  }

  return (
<Sidebar
  variant="sidebar"
  collapsible="icon"
  className="bg-[--sidebar] text-[--sidebar-foreground] !backdrop-blur-none !bg-opacity-100 shadow-md"
>





      <SidebarHeader className="flex items-center justify-between p-2">

        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(
                (item) =>
                  (!item.authRequired || user || loading) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            <SidebarSeparator />
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      Projects
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {projects.map((project) => (
                        <SidebarMenuItem key={project.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={
                              pathname === "/tasks" &&
                              new URLSearchParams(window.location.search).get("category") === project.category
                            }
                          >
                            {/* Link to tasks page with category query parameter */}
                            <Link href={`/tasks?category=${project.category}`}>
                              <project.icon />
                              <span>{project.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                          <DialogTrigger asChild>
                            <SidebarMenuButton onClick={() => setIsFormOpen(true)}>
                              <Plus />
                              <span>Add New Project</span>
                            </SidebarMenuButton>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <TaskForm onTaskCreated={handleTaskCreated} />
                          </DialogContent>
                        </Dialog>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> {user.email}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
