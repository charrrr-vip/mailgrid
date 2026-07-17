import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Start building email campaigns with Mailforge">
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
