"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardSidebar } from "@/components/admin/dashboard-sidebar";
import { authClient } from "@/lib/auth-client";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  const relevantSegments =
    pathSegments[0] === "admin" ? pathSegments.slice(1) : pathSegments;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-background overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/admin">Admin</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {relevantSegments.length > 0 && <BreadcrumbSeparator />}
                {relevantSegments.map((segment, index) => {
                  const href = `/admin/${relevantSegments
                    .slice(0, index + 1)
                    .join("/")}`;
                  const isLast = index === relevantSegments.length - 1;
                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="capitalize">
                            {segment}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild className="capitalize">
                            <Link href={href}>{segment}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
