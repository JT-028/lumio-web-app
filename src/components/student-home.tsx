"use client";

import { useSignOut } from "@/components/shell";

const COURSES = ["Geography 6", "History 6", "Language 6", "Mathematics 6"] as const;
const SECTIONS = [
  "Flashcards",
  "Concepts",
  "Step-by-Step Solver",
  "Tutor",
  "Cheat Sheet",
  "Practice Sets",
] as const;

const LUMI_ALT =
  "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.";

// Sheet is 1536×1024. CSS frames row 1, column 1, about x 0–413 and y 0–358.
const lumiSrc = new URL("../assets/lumio_mascot.png", import.meta.url).href;

export function StudentHome({ firstName }: { firstName: string }) {
  const { signOutError, signingOut, onSignOut } = useSignOut();
  const name = firstName.trim();

  return (
    <div className="student-home">
      <header className="student-top">
        <div>
          <p className="wordmark">Lumio</p>
          <p className="tagline">
            Learn. Grow. <span className="level-up">Level Up.</span>
          </p>
        </div>
        <button
          type="button"
          className="top-sign-out"
          onClick={() => {
            void onSignOut();
          }}
          disabled={signingOut}
        >
          Sign out
        </button>
      </header>
      <aside className="student-rail">
        <div className="rail-brand">
          <p className="wordmark">Lumio</p>
          <p className="tagline">
            Learn. Grow. <span className="level-up">Level Up.</span>
          </p>
        </div>
        <a className="home-link rail-home" href="/home" aria-current="page">
          Home
        </a>
        <p className="student-name">{name}</p>
        <button
          type="button"
          className="rail-sign-out"
          onClick={() => {
            void onSignOut();
          }}
          disabled={signingOut}
        >
          Sign out
        </button>
        <p className={signOutError ? "status is-error student-status" : "status student-status"} aria-live="polite">
          {signOutError}
        </p>
      </aside>
      <div className="student-main">
        <section className="student-hero" aria-labelledby="student-hello">
          <div className="student-hero-copy">
            <h1 id="student-hello" className="student-hello">
              Hello, {name}.
            </h1>
            <p className="lumi-line">{"Hi, I'm Lumi. Ready to discover something new?"}</p>
          </div>
          <div className="lumi-frame">
            <img src={lumiSrc} alt={LUMI_ALT} />
          </div>
        </section>
        <section className="quiet-card student-today" aria-labelledby="today-heading">
          <h2 id="today-heading">Today{"\u2019"}s study</h2>
          <p>No study time yet.</p>
        </section>
        <section className="quiet-card student-continue" aria-labelledby="continue-heading">
          <h2 id="continue-heading">Continue learning</h2>
          <p className="quiet-copy">Your next guide is not on this page yet.</p>
          <p className="quiet-copy">A guide is one course and one quarter.</p>
        </section>
        <section className="student-guides" aria-labelledby="guides-heading">
          <h2 id="guides-heading">Guides</h2>
          <ul className="guide-list">
            {COURSES.map((course) => (
              <li key={course} className="guide-card" aria-label={`${course}, Quarter 1, Quarter 2`}>
                <p className="course-name">{course}</p>
                <p className="quarter">Quarter 1</p>
                <p className="quarter">Quarter 2</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="student-sections" aria-labelledby="sections-heading">
          <h2 id="sections-heading">Study sections</h2>
          <ul className="section-list">
            {SECTIONS.map((section) => (
              <li key={section} className="section-chip">
                {section}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <nav className="student-bottom" aria-label="Home">
        <a className="home-link" href="/home" aria-current="page">
          Home
        </a>
      </nav>
    </div>
  );
}
