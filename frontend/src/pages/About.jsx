import React from "react";
import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <Helmet>
        <title>About Us | CurrentNews365</title>
        <meta
          name="description"
          content="Learn about CurrentNews365, an independent digital news platform providing timely and accessible news updates."
        />
      </Helmet>

      <h1 className="text-4xl font-bold mb-10">About Us</h1>

      <p className="mb-6">
        <strong>CurrentNews365</strong> is an independent digital news platform
        created to provide timely, relevant, and easy-to-understand news to
        readers in India and across the world. Our goal is to make important
        information accessible to everyday readers without unnecessary
        complexity or sensationalism.
      </p>

      <p className="mb-6">
        We publish breaking news, trending stories, and informational updates
        across a wide range of categories including current affairs,
        technology, business, entertainment, sports, and general news. Our
        platform is designed to help readers stay informed about events that
        matter in their daily lives.
      </p>

      <p className="mb-6">
        CurrentNews365 operates as an independent initiative managed under the
        CurrentNews365 name. As a developing digital publication, we focus on
        consistency, transparency, and clarity in how information is presented
        to our audience.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Our Editorial Philosophy
      </h2>

      <p className="mb-6">
        News today moves quickly, and information is published across many
        platforms. At CurrentNews365, we aim to organize and present information
        in a way that is easy to follow and relevant for readers.
      </p>

      <p className="mb-6">
        Our content may include original reporting, rewritten or summarized
        information based on publicly available sources, and fact-based updates
        inspired by multiple news platforms. Articles are written in original
        language with the intent of improving clarity, readability, and
        accessibility.
      </p>

      <p className="mb-6">
        While we strive to ensure accuracy, news developments can evolve
        rapidly. Readers are encouraged to verify critical or sensitive
        information through official announcements or primary sources when
        necessary.
      </p>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Transparency & Responsibility
      </h2>

      <p className="mb-6">
        Transparency is an important part of building trust with our readers.
        We make our policies, disclaimers, and contact information publicly
        available so readers can understand how our platform operates.
      </p>

      <p className="mb-6">
        CurrentNews365 does not claim to replace official sources or authorities.
        Our content is intended for general informational purposes and public
        awareness.
      </p>

      <p className="mt-10 font-medium">
        CurrentNews365 — Independent news for informed readers.
      </p>
    </main>
  );
}
