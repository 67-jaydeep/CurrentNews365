import React from "react";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <Helmet>
        <title>Terms of Service | CurrentNews365</title>
      </Helmet>

      <h1 className="text-4xl font-bold mb-10">Terms of Service</h1>

      <p className="mb-6">
        By accessing and using CurrentNews365, you agree to comply with these
        Terms of Service. If you do not agree, please discontinue use of the
        website.
      </p>

      <p className="mb-6">
        Content published on this website is provided for informational
        purposes only and may be updated, modified, or removed at any time
        without notice.
      </p>

      <p className="mb-6">
        Unauthorized reproduction, redistribution, or misuse of content is
        prohibited except as permitted under applicable law.
      </p>

      <p className="mb-6">
        CurrentNews365 shall not be liable for any damages arising from use of
        the website.
      </p>

      <p className="mb-6">
        These terms are governed by the laws of India.
      </p>
    </main>
  );
}
