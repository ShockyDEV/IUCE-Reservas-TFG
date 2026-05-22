import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = {
    name: session.user.name ?? session.user.email ?? "",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "USER",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <InstitutionalFooter />
    </div>
  );
}
