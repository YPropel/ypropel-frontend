// pages/about-us.tsx

import React from "react";
import AuthGuard from "../components/AuthGuard";

export default function AboutUs() {
  return (
    <AuthGuard>
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">About YPropel</h1>

        <section className="mb-10">
          <p className="text-lg leading-relaxed text-gray-800">
            YPropel is a platform designed to empower students and young professionals by bridging the gap between education and career readiness. Our mission is to provide resources, networking opportunities, and career development tools to help you achieve your goals.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Our Vision</h2>
          <p className="text-gray-700 leading-relaxed">
            To be the global hub for students and young professionals to discover opportunities, gain real-world experience, and build meaningful connections that propel their careers forward.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Our Mission</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Connect students with internships, jobs, and mentors worldwide.</li>
            <li>Provide educational content and career coaching tailored to early career stages.</li>
            <li>Create a vibrant community to share experiences, challenges, and success stories.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Why Choose YPropel?</h2>
          <p className="text-gray-700 leading-relaxed">
            We understand the challenges students face in transitioning from academia to the professional world. YPropel offers a comprehensive platform that combines technology, community, and expertise to guide you every step of the way.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Join Us</h2>
          <p className="text-gray-700 leading-relaxed">
            Whether you’re a student, educator, employer, or mentor, YPropel welcomes you to be part of a growing network dedicated to career success and lifelong learning.
          </p>
        </section>
      </main>
    </AuthGuard>
  );
}
