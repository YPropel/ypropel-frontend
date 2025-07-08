import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setMessage("");
    setError("");
  }, [token]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      return setError("Please fill in both fields.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      const res = await fetch("http://localhost:4000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setMessage("✅ Password has been reset successfully. Redirecting...");
      setError("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect after showing success message
      setTimeout(() => {
        router.push("/main");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-4">Reset Your Password</h2>

        {message && (
          <p className="text-green-600 mb-3 text-center font-medium">{message}</p>
        )}
        {error && (
          <p className="text-red-600 mb-3 text-center font-medium">{error}</p>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="w-full px-4 py-2 border rounded mb-3"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full px-4 py-2 border rounded mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={handleReset}
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
