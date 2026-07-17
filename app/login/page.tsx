import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back!" subtitle="Sign in to your Mailforge workspace">
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
