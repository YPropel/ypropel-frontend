import React from "react";
import AuthGuard from "../components/AuthGuard";

export default function Terms() {
  return (
    <AuthGuard>
      <main
        className="max-w-4xl mx-auto p-6 bg-white rounded shadow my-10 overflow-auto"
        style={{ maxHeight: "80vh" }}
      >
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Terms and Conditions</h1>

        <section className="space-y-4 text-gray-800 text-sm leading-relaxed">
          <p>
            www.ypropel.com constitutes your agreement to all such Terms. Please read these terms carefully, and keep a copy of them for your reference.
          </p>

          <p><strong>www.ypropel.com is a Social Networking Site.</strong></p>

          <p>
            A professional social networking platform exclusively designed for high school and university students embarking on their educational and career journeys. Get access to social networking, mentorship, educational resources, Jobs & Internship opportunities.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Privacy</h2>
          <p>
            Your use of www.dolphinselite.com is subject to YPropel's Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Electronic Communications</h2>
          <p>
            Visiting www.ypropel.com or sending emails to YPropel constitutes electronic communications. You consent to receive electronic communications and you agree that all agreements, notices, disclosures and other communications that we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communications be in writing.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Your Account</h2>
          <p>
            If you use this site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer, and you agree to accept responsibility for all activities that occur under your account or password. You may not assign or otherwise transfer your account to any other person or entity. You acknowledge that YPropel is not responsible for third party access to your account that results from theft or misappropriation of your account. YPropel and its associates reserve the right to refuse or cancel service, terminate accounts, or remove or edit content in our sole discretion.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Children Under Thirteen</h2>
          <p>
            YPropel does not knowingly collect, either online or offline, personal information from persons under the age of thirteen. If you are under 18, you may use www.YPropel.com only with permission of a parent or guardian.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Cancellation/Refund Policy</h2>
          <p>You may delete your account at any time. Please contact us at romar@ypropel.com with any questions.</p>

          <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>ypropel@ypropel.com</p>

          <p className="mt-8 text-xs text-gray-500">Effective as of March 16, 2024</p>
        </section>
      </main>
    </AuthGuard>
  );
}
