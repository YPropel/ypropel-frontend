"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ForgotPasswordPage;
const react_1 = require("react");
function ForgotPasswordPage() {
    const [email, setEmail] = (0, react_1.useState)("");
    const [message, setMessage] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            return setError("Please enter your email.");
        }
        try {
            const res = await fetch("http://localhost:4000/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong.");
            }
            setMessage("If an account with this email exists, a reset link has been sent.");
            setError("");
            setEmail("");
        }
        catch (err) {
            setError(err.message);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-4">Forgot Password</h2>

        {message && <p className="text-green-600 mb-3 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded mb-4" value={email} onChange={(e) => setEmail(e.target.value)}/>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>);
}
