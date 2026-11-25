"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CloudDecor, SparkleDecor } from "@/components/icons";
import { LumiImage, type Pose } from "@/components/lumi-image";

/** 05:00–11:59 morning, 12:00–17:59 afternoon, otherwise evening (local time). */
export function timeGreeting(date: Date): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

/** "Hello, {name}!" on first render, then the time of day once mounted (no hydration mismatch). */
export function Greeting({ name }: { name: string }) {
  const [word, setWord] = useState("Hello");
  useEffect(() => { setWord(timeGreeting(new Date())); }, []);
  const trimmed = name.trim();
  return <>{word}{trimmed ? <>, <span className="hero-name">{trimmed}</span></> : null}!</>;
}

export function HeroCard({ title, eyebrow, sub, actions, pose, alt, landing = false }: {
  title: ReactNode;
  eyebrow?: string;
  sub: ReactNode;
  actions?: ReactNode;
  pose: Pose;
  alt: string;
  landing?: boolean;
}) {
  return (
    <section className={landing ? "hero hero--landing" : "hero"} aria-labelledby="hero-title">
      {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
      <h1 id="hero-title" className="hero-greeting">{title}</h1>
      <p className="hero-sub">{sub}</p>
      {actions ? <div className="hero-actions">{actions}</div> : null}
      <div className="hero-lumi">
        <CloudDecor className="decor decor-cloud decor-cloud-1" />
        <CloudDecor className="decor decor-cloud decor-cloud-2" />
        <SparkleDecor className="decor decor-sparkle decor-sparkle-1" />
        <SparkleDecor className="decor decor-sparkle decor-sparkle-2" />
        <LumiImage pose={pose} alt={alt} size="lg" priority />
      </div>
    </section>
  );
}
