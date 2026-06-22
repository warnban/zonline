import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = { title: "Admin Login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
