import React from "react";
import { Helmet } from "react-helmet-async";

export default function EditorialPolicy() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <Helmet>
        <title>Editorial Policy & Disclaimer | CurrentNews365</title>
      </Helmet>

      <h1 className="text-4xl font-bold mb-10">
        Editorial Policy & Disclaimer
      </h1>

      <p className="mb-6">
        CurrentNews365 is an independent digital news and information platform
        created to provide general news updates, trending topics, and
        informational content for public awareness.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Content Creation & Sources
      </h2>

      <p className="mb-6">
        Content published on CurrentNews365 may be created through a variety of
        methods, including original writing, rewriting, summarizing, and
        adapting information from publicly available sources and media reports.
      </p>

      <p className="mb-6">
        Articles may be inspired by reports published on other news platforms,
        official announcements, press releases, or public information sources.
        All content is written in original language with the intention of
        presenting information clearly and accessibly.
      </p>

      <p className="mb-6">
        We do not claim ownership over third-party content. All trademarks,
        logos, brand names, and referenced materials remain the property of
        their respective owners.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Accuracy & Updates
      </h2>

      <p className="mb-6">
        While we strive to ensure accuracy at the time of publication, news
        events and information may change over time. CurrentNews365 does not
        guarantee that all published content will remain complete, current, or
        error-free.
      </p>

      <p className="mb-6">
        Content may be updated, corrected, or removed without prior notice as
        new information becomes available.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Images, Media & Visuals
      </h2>

      <p className="mb-6">
        Images and media used on CurrentNews365 may include original visuals,
        AI-generated images, free stock images, or images used strictly for
        illustrative and informational purposes.
      </p>

      <p className="mb-6">
        All image rights belong to their respective owners. If you believe that
        any media published on this website infringes copyright or ownership
        rights, please contact us with relevant details for review and
        resolution.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Disclaimer & Limitation of Liability
      </h2>

      <p className="mb-6">
        All information provided on CurrentNews365 is published in good faith
        for general informational purposes only. We make no warranties
        regarding completeness, reliability, or accuracy.
      </p>

      <p className="mb-6">
        Any action taken based on information found on this website is strictly
        at the reader’s own risk. CurrentNews365 shall not be held liable for
        any losses or damages arising from the use of this website.
      </p>

      <p className="mb-6">
        This website does not provide professional, legal, medical, or
        financial advice.
      </p>
    </main>
  );
}
