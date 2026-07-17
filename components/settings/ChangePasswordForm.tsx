"use client";

import { useState } from "react";
import { Alert, Form, Input, Button } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form] = Form.useForm();

  async function handleSubmit(values: {
    password: string;
    confirmPassword: string;
  }) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    form.resetFields();
    setSuccess("Password updated successfully.");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} showIcon />}
      {success && <Alert type="success" message={success} showIcon />}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="password"
          label="New password"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="New password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Confirm new password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="border-none bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] font-semibold !text-white [&_span]:!text-white"
        >
          Update password
        </Button>
      </Form>
    </div>
  );
}
