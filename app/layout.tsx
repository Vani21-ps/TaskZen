import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { Toaster } from "react-hot-toast"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/Auth/AuthContext"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskZen - Smart Productivity App",
  description: "Your smart productivity companion.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="animated-background-overlay" aria-hidden="true" />
          <AuthProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
  <div className="flex min-h-screen">
    <AppSidebar />
    <div className="flex-1 flex flex-col">
      <SidebarInset>
       <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
  <SidebarTrigger className="lg:hidden" /> {/* 👈 ADD THIS */}
  <h1 className="text-3xl font-extrabold text-primary tracking-tight">TaskZen</h1>
</header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 pb-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  </div>
</SidebarProvider>

          </AuthProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
