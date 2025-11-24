import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          {children}
        </div>
      </main>
    </div>
  )
}
