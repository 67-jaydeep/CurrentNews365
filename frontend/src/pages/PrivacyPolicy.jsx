import React from "react";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <Helmet>
        <title>Privacy Policy | CurrentNews365</title>
      </Helmet>

      <h1 className="text-4xl font-bold mb-10">Privacy Policy</h1>

      <p className="mb-6">
        At CurrentNews365, we respect and value the privacy of our visitors.
        This Privacy Policy explains how information may be collected, used,
        and protected when you access our website.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Information Collection
      </h2>

      <p className="mb-6">
        CurrentNews365 does not require users to create accounts or submit
        personal information to access content. However, certain technical
        information may be collected automatically when users browse the
        website.
      </p>

      <p className="mb-6">
        This may include IP address, browser type, device information, pages
        visited, referring URLs, and date/time stamps.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Cookies & Tracking Technologies
      </h2>

      <p className="mb-6">
        Cookies may be used to enhance user experience, analyze site traffic,
        and improve performance. Users may disable cookies through browser
        settings.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Third-Party Services
      </h2>

      <p className="mb-6">
        We may use third-party services such as analytics tools or advertising
        partners in the future. These services operate under their own privacy
        policies, and CurrentNews365 has no control over their data practices.
      </p>

      <p className="mb-6">
        By using this website, you consent to this Privacy Policy.
      </p>
    </main>
  );
}
