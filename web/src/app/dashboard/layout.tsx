import { AppSidebar } from "@/components/dashboard/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DatasetProvider } from "@/providers/dataset-provider"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DatasetProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:px-6 bg-white border-gray-200 shadow-sm">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-gray-200" />
                        <div className="flex w-full items-center justify-between">
                            <h1 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Operational Console</h1>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col min-h-0 bg-[#e8e8e8]">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </DatasetProvider>
    )
}
