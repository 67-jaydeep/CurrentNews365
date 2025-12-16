import React from "react";
import { Helmet } from "react-helmet-async";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <Helmet>
        <title>Contact Us | CurrentNews365</title>
      </Helmet>

      <h1 className="text-4xl font-bold mb-10">Contact Us</h1>

      <p className="mb-6">
        We welcome feedback, corrections, copyright concerns, and general
        inquiries related to content published on CurrentNews365.
      </p>

      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <Mail className="w-5 h-5 text-[var(--accent-color)]" />
        <span className="font-medium">
          contact@currentnews365.com
        </span>
      </div>
    </main>
  );
}
