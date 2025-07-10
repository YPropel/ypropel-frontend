"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OAuthCallback;
const react_1 = require("react");
const router_1 = require("next/router");
function OAuthCallback() {
    const router = (0, router_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!router.isReady)
            return;
        const { token } = router.query;
        if (typeof token === "string") {
            localStorage.setItem("token", token);
            // Optionally, fetch user profile here with token and store user info in localStorage or state
            router.replace("/"); // redirect to home
        }
        else {
            alert("OAuth login failed: No token received");
            router.replace("/login"); // or wherever your login page is
        }
    }, [router.isReady, router.query, router]);
    return <div>Logging you in...</div>;
}
