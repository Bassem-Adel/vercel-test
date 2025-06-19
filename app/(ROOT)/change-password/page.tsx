"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdatePassword = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage("Password updated successfully!");
    } else {
      setMessage(result.error || "Failed to update password.");
    }

    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Update Password</h1>
      <Input
        type="password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-64"
      />
      <Button onClick={handleUpdatePassword} disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </Button>
      {message && <p className="text-center text-muted-foreground">{message}</p>}
    </main>
  );
}