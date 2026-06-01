import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const user = {
    name: session.user.name ?? session.user.email ?? "",
    email: session.user.email ?? "",
    role: role ?? "USER",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-3 py-0.5 text-xs font-medium text-usal-red">
            <ShieldCheck className="h-3.5 w-3.5" />
            Panel de administración
          </span>
        </div>
      </div>
      <main className="flex-1">{children}</main>
      <InstitutionalFooter />
    </div>
  );
}
