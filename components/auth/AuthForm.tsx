"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form] = Form.useForm();

  async function handleSubmit(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      form.resetFields();
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. Check your email to confirm your registration.");
    setLoading(false);
  }

  return (
    <>
      {error && (
        <Alert type="error" message={error} showIcon className="mb-4" />
      )}
      {message && (
        <Alert type="success" message={message} showIcon className="mb-4" />
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Invalid email address" },
          ]}
        >
          <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please enter your password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="border-none bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] font-semibold !text-white [&_span]:!text-white"
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center">
        <span className="text-gray-600">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        </span>
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="font-semibold text-primary hover:text-primary-dark"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </Link>
      </div>
    </>
  );
}
