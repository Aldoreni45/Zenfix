"use client";

import Image from "next/image";
import { memo } from "react";
import { frontendTech } from "./Frontend";
import { backendTech } from "./Backend";
import { databaseTech } from "./Database";
import { cloudTech } from "./Cloud";
import { aiTech } from "./AI";
import { mobileTech } from "./Mobile";
import { devopsTech } from "./DevOps";
import type { Technology } from "./Frontend";

// Combine all technologies
const allTechs: Technology[] = [
  ...frontendTech,
  ...backendTech,
  ...databaseTech,
  ...cloudTech,
  ...aiTech,
  ...mobileTech,
  ...devopsTech,
];

// Distribute technologies across rows
const NUM_ROWS = 5;

function distributeRows(items: Technology[], numRows: number): Technology[][] {
  const rows: Technology[][] = Array.from({ length: numRows }, () => []);
  items.forEach((item, i) => rows[i % numRows].push(item));
  return rows;
}

// Memoized tech card component
const TechCard = memo(({ tech }: { tech: Technology }) => {
  return (
    <div
      className="tech-card"
      style={{ "--card-color": tech.color } as React.CSSProperties}
      aria-label={tech.name}
    >
      <div className="tech-card__shimmer" />
      <div className="tech-card__glow" />
      <div className="tech-card__icon">
        <Image
          src={tech.icon}
          alt={tech.name}
          width={32}
          height={32}
          loading="lazy"
          className="w-8 h-8"
        />
      </div>
      <span className="tech-card__label">{tech.name}</span>
    </div>
  );
});

TechCard.displayName = "TechCard";

// Marquee row component
const MarqueeRow = memo(({ 
  items, 
  direction, 
  speed = 40 
}: { 
  items: Technology[]; 
  direction: "left" | "right"; 
  speed?: number 
}) => {
  const doubled = [...items, ...items, ...items];

  return (
    <div className="marquee-row">
      <div
        className={`marquee-track ${direction === "right" ? "marquee-track--reverse" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((tech, idx) => (
          <TechCard key={`${tech.name}-${idx}`} tech={tech} />
        ))}
      </div>
    </div>
  );
});

MarqueeRow.displayName = "MarqueeRow";

// Main TechStack component
export default function TechStack() {
  const rows = distributeRows(allTechs, NUM_ROWS);
  const speeds = [42, 56, 48, 62, 52];

  return (
    <>
      <style>{`
        .tech-section {
          position: relative;
          width: 100%;
          padding: 6rem 0 7rem;
          background: #050816;
          overflow: hidden;
          isolation: isolate;
        }

        /* Grid overlay */
        .tech-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
          background-size: 58px 58px;
          pointer-events: none;
          z-index: 0;
        }

        /* Blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
        }
        .blob--blue {
          width: 650px; height: 650px;
          top: -180px; left: -180px;
          background: radial-gradient(circle, rgba(37,99,235,.22) 0%, transparent 70%);
          animation: blobFloat 18s ease-in-out infinite alternate;
        }
        .blob--purple {
          width: 580px; height: 580px;
          bottom: -120px; right: -120px;
          background: radial-gradient(circle, rgba(124,58,237,.2) 0%, transparent 70%);
          animation: blobFloat 23s ease-in-out infinite alternate-reverse;
        }
        .blob--cyan {
          width: 450px; height: 450px;
          top: 35%; left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(6,182,212,.1) 0%, transparent 70%);
          animation: blobFloat 16s ease-in-out infinite alternate;
        }
        @keyframes blobFloat {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(30px,-40px) scale(1.08); }
          100% { transform: translate(-20px,30px) scale(.95); }
        }

        /* Header */
        .tech-header {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 1.5rem 4rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .tech-header__badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .4rem 1.2rem;
          border-radius: 9999px;
          background: rgba(37,99,235,.12);
          border: 1px solid rgba(37,99,235,.35);
          color: #60A5FA;
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #60A5FA;
          animation: pulseDot 2s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .4; transform: scale(1.5); }
        }
        .tech-header__title {
          font-size: clamp(2.2rem, 5vw, 4rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 1.25rem;
          font-family: var(--font-sora, 'Sora', sans-serif);
        }
        .tech-header__subtitle {
          color: #94A3B8;
          font-size: clamp(.9rem, 1.5vw, 1.1rem);
          line-height: 1.75;
          max-width: 680px;
          margin: 0 auto;
        }

        /* Marquee container – fades both edges */
        .marquee-container {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }

        /* Row */
        .marquee-row { 
          overflow: hidden; 
          width: 100%; 
        }

        /* Track - CSS-only animation */
        .marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: marqueeLeft linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-track--reverse { 
          animation-name: marqueeRight; 
        }

        @keyframes marqueeLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.3333%); }
        }
        @keyframes marqueeRight {
          from { transform: translateX(-33.3333%); }
          to   { transform: translateX(0); }
        }

        /* Card */
        .tech-card {
          position: relative;
          flex-shrink: 0;
          width: 140px;
          height: 100px;
          border-radius: 1rem;
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .55rem;
          cursor: pointer;
          overflow: hidden;
          transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
        }
        .tech-card:hover {
          border-color: color-mix(in srgb, var(--card-color) 55%, transparent);
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--card-color) 35%, transparent),
            0 8px 40px color-mix(in srgb, var(--card-color) 28%, transparent),
            0 20px 60px rgba(0,0,0,.4),
            inset 0 1px 0 rgba(255,255,255,.12);
          transform: translateY(-4px) scale(1.05);
        }

        /* Shimmer */
        .tech-card__shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 50%, rgba(255,255,255,.03) 100%);
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
        }
        .tech-card:hover .tech-card__shimmer { opacity: 1; }

        /* Glow ring */
        .tech-card__glow {
          position: absolute; inset: -1px;
          border-radius: inherit;
          background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--card-color) 30%, transparent), transparent 70%);
          opacity: 0;
          transition: opacity .3s ease;
          pointer-events: none;
          z-index: -1;
        }
        .tech-card:hover .tech-card__glow { opacity: 1; }

        /* Icon */
        .tech-card__icon {
          display: flex; align-items: center; justify-content: center;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1);
        }
        .tech-card:hover .tech-card__icon { transform: rotate(8deg) scale(1.1); }

        /* Label */
        .tech-card__label {
          font-size: .67rem;
          font-weight: 600;
          color: #CBD5E1;
          letter-spacing: .04em;
          text-align: center;
          transition: color .25s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 122px;
        }
        .tech-card:hover .tech-card__label { color: #fff; }

        /* Bottom fade */
        .tech-fade-bottom {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 90px;
          background: linear-gradient(to bottom, transparent, #050816);
          pointer-events: none;
          z-index: 20;
        }

        /* Responsive - Mobile First */
        @media (max-width: 320px) {
          .tech-section { padding: 3rem 0 4rem; }
          .tech-card { width: 90px; height: 70px; }
          .tech-card__label { font-size: .55rem; max-width: 80px; }
          .marquee-container {
            mask-image: linear-gradient(to right, transparent 0%, #000 2%, #000 98%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 2%, #000 98%, transparent 100%);
          }
        }

        @media (min-width: 321px) and (max-width: 375px) {
          .tech-section { padding: 3.5rem 0 4.5rem; }
          .tech-card { width: 95px; height: 72px; }
          .tech-card__label { font-size: .57rem; max-width: 85px; }
        }

        @media (min-width: 376px) and (max-width: 390px) {
          .tech-section { padding: 3.5rem 0 4.5rem; }
          .tech-card { width: 100px; height: 74px; }
          .tech-card__label { font-size: .59rem; max-width: 88px; }
        }

        @media (min-width: 391px) and (max-width: 430px) {
          .tech-section { padding: 4rem 0 5rem; }
          .tech-card { width: 105px; height: 76px; }
          .tech-card__label { font-size: .61rem; max-width: 92px; }
        }

        @media (min-width: 431px) and (max-width: 480px) {
          .tech-section { padding: 4rem 0 5rem; }
          .tech-card { width: 110px; height: 78px; }
          .tech-card__label { font-size: .63rem; max-width: 96px; }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .tech-section { padding: 4rem 0 5rem; }
          .tech-card { width: 118px; height: 86px; }
          .tech-card__label { font-size: .61rem; }
          .marquee-container {
            mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .tech-section { padding: 5rem 0 6rem; }
          .tech-card { width: 130px; height: 92px; }
          .tech-card__label { font-size: .65rem; }
        }

        @media (min-width: 1025px) and (max-width: 1366px) {
          .tech-section { padding: 5.5rem 0 6.5rem; }
          .tech-card { width: 140px; height: 100px; }
          .tech-card__label { font-size: .67rem; }
        }

        @media (min-width: 1367px) and (max-width: 1440px) {
          .tech-section { padding: 6rem 0 7rem; }
          .tech-card { width: 150px; height: 105px; }
          .tech-card__label { font-size: .68rem; }
        }

        @media (min-width: 1441px) and (max-width: 1600px) {
          .tech-section { padding: 6rem 0 7rem; }
          .tech-card { width: 155px; height: 108px; }
          .tech-card__label { font-size: .69rem; }
        }

        @media (min-width: 1601px) and (max-width: 1920px) {
          .tech-section { padding: 6.5rem 0 7.5rem; }
          .tech-card { width: 160px; height: 110px; }
          .tech-card__label { font-size: .7rem; }
        }

        @media (min-width: 1921px) and (max-width: 2560px) {
          .tech-section { padding: 7rem 0 8rem; }
          .tech-card { width: 170px; height: 115px; }
          .tech-card__label { font-size: .72rem; }
        }

        @media (min-width: 2561px) {
          .tech-section { padding: 8rem 0 9rem; }
          .tech-card { width: 180px; height: 120px; }
          .tech-card__label { font-size: .75rem; }
        }
      `}</style>
      <section id="technologies" className="tech-section">
        {/* Blobs */}
        <div className="blob blob--blue" />
        <div className="blob blob--purple" />
        <div className="blob blob--cyan" />

        {/* Grid */}
        <div className="tech-grid" />

        {/* Header */}
        <div className="tech-header">
          <div className="tech-header__badge">
            <span className="badge-dot" />
            Our Tech Stack
          </div>

          <h2 className="tech-header__title">
            Technologies <span className="gradient-text">We Use</span>
          </h2>

          <p className="tech-header__subtitle">
            Explore the trusted technologies, frameworks, cloud platforms, AI tools, and software we use to build
            fast, scalable, secure, and future-ready digital products.
          </p>
        </div>

        {/* Marquee rows */}
        <div className="marquee-container">
          {rows.map((row, i) => (
            <MarqueeRow 
              key={i} 
              items={row} 
              direction={i % 2 === 0 ? "left" : "right"} 
              speed={speeds[i]} 
            />
          ))}
        </div>

        {/* Bottom fade */}
        <div className="tech-fade-bottom" />
      </section>
    </>
  );
}
