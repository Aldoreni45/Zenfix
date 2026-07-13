"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Technology {
  name: string;
  color: string;
  svg: React.ReactNode;
}

// ─── SVG Logo Library ───────────────────────────────────────────────────────

const techs: Technology[] = [
  // ── Frontend ──────────────────────────────────────────────────────────────
  {
    name: "HTML5",
    color: "#E34F26",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#E34F26" d="M5 3h22l-2 22.39L16 29l-9-3.6L5 3z"/>
        <path fill="#EF652A" d="M16 27.4l7.27-2.91 1.71-19.49H16v22.4z"/>
        <path fill="#fff" d="M16 13.5h-4.27l-.3-3.27H16V7H8.5l.08.9.78 8.6H16V13.5zm0 7.27l-.01.01-3.57-1.1-.23-2.5H9.5l.44 5.05L16 24v-3.23z"/>
        <path fill="#EBEBEB" d="M16 13.5v3H19.7l-.35 4.16-3.35 1.01V24l6.2-1.9.05-.51.7-8.09H16z M16 7v3.23h6.87l.06-.64.14-1.69.07-.9H16z"/>
      </svg>
    ),
  },
  {
    name: "CSS3",
    color: "#1572B6",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#1572B6" d="M5 3h22l-2 22.39L16 29l-9-3.6L5 3z"/>
        <path fill="#33A9DC" d="M16 27.4l7.27-2.91 1.71-19.49H16v22.4z"/>
        <path fill="#fff" d="M16 13.5H11.4l-.17-1.9H16V8.63H8.26l.45 4.87H16V13.5zm0 7.43v-3.34h-.01l-3.51-1.08-.23-2.49H9.5l.45 5.02 5.99 1.89H16z"/>
        <path fill="#EBEBEB" d="M16 13.5v2h3.54l-.33 4.09-3.21.97v3.35l6.01-1.86.04-.5.75-8.05H16zM16 8.63v2.97h6.69l.06-.65.14-1.66.07-.66H16z"/>
      </svg>
    ),
  },
  {
    name: "JavaScript",
    color: "#F7DF1E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="3" fill="#F7DF1E"/>
        <path fill="#323330" d="M9.11 26.69l2.26-1.37c.44.78.84 1.44 1.8 1.44.92 0 1.5-.36 1.5-1.76V15.5h2.78v9.56c0 2.9-1.7 4.22-4.18 4.22-2.24 0-3.54-1.16-4.16-2.59zm9.25-.47l2.26-1.38c.6.97 1.37 1.68 2.74 1.68 1.15 0 1.89-.58 1.89-1.37 0-.95-.75-1.29-2.03-1.84l-.7-.3c-2.01-.86-3.35-1.93-3.35-4.2 0-2.09 1.59-3.68 4.08-3.68 1.77 0 3.05.61 3.96 2.23l-2.17 1.39c-.48-.86-.99-1.19-1.79-1.19-.81 0-1.33.52-1.33 1.19 0 .83.52 1.16 1.71 1.67l.7.3c2.37 1.02 3.71 2.05 3.71 4.38 0 2.51-1.97 3.88-4.62 3.88-2.59 0-4.27-1.23-5.06-2.86z"/>
      </svg>
    ),
  },
  {
    name: "TypeScript",
    color: "#3178C6",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="3" fill="#3178C6"/>
        <path fill="#fff" d="M18.65 22.29v2.58c.42.22.92.38 1.5.5a8.5 8.5 0 001.76.17c.6 0 1.17-.06 1.7-.19a3.97 3.97 0 001.37-.6 2.86 2.86 0 00.91-1.06c.22-.44.33-.96.33-1.57 0-.45-.07-.85-.2-1.19a2.7 2.7 0 00-.58-.9 4.1 4.1 0 00-.91-.7 9.4 9.4 0 00-1.2-.58l-.97-.38a5.4 5.4 0 01-.64-.3 1.67 1.67 0 01-.4-.32.64.64 0 01-.14-.42c0-.15.04-.29.11-.4a.91.91 0 01.32-.29 1.6 1.6 0 01.5-.17c.2-.04.42-.06.68-.06a4.5 4.5 0 011.5.27c.24.08.47.18.68.31V15.5a5.9 5.9 0 00-1.3-.35 9.4 9.4 0 00-1.56-.12c-.58 0-1.12.07-1.63.2a3.9 3.9 0 00-1.32.6 2.83 2.83 0 00-.88 1.04c-.21.42-.32.93-.32 1.52 0 .75.21 1.38.62 1.88.41.5 1.04.93 1.88 1.27l1 .4c.26.1.48.21.66.32.18.11.32.23.41.37.1.14.14.3.14.5 0 .15-.04.29-.12.42a.97.97 0 01-.34.31c-.15.09-.33.16-.56.2a3.7 3.7 0 01-.77.08c-.52 0-1.04-.09-1.56-.27a5.2 5.2 0 01-1.43-.73zM12.9 16.7H16v-2.38H7.5V16.7h3.08v9.98h2.32V16.7z"/>
      </svg>
    ),
  },
  {
    name: "React",
    color: "#61DAFB",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="2.3" fill="#61DAFB"/>
        <ellipse cx="16" cy="16" rx="13" ry="5" fill="none" stroke="#61DAFB" strokeWidth="1.5"/>
        <ellipse cx="16" cy="16" rx="13" ry="5" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 16 16)"/>
        <ellipse cx="16" cy="16" rx="13" ry="5" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 16 16)"/>
      </svg>
    ),
  },
  {
    name: "Next.js",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#000"/>
        <path fill="#fff" d="M10.5 10h2.1v8.4l6.5-8.4H21l-5.8 7.5L21.5 22H19l-6.4-9V22h-2.1V10z"/>
      </svg>
    ),
  },
  {
    name: "Vue",
    color: "#4FC08D",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#4FC08D" d="M16 29L2 5h6.5L16 18.5 23.5 5H30z"/>
        <path fill="#35495E" d="M16 29l-7-12h3.5L16 22l3.5-5H23z"/>
      </svg>
    ),
  },
  {
    name: "Angular",
    color: "#DD0031",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#DD0031" d="M16 3L3 8l1.97 17.06L16 30l11.03-4.94L29 8z"/>
        <path fill="#C3002F" d="M16 3v27l11.03-4.94L29 8z"/>
        <path fill="#fff" d="M16 7.5l-7.5 17h2.8l1.6-4h6.2l1.6 4h2.8zm0 5.5l2.3 5.5h-4.6z"/>
      </svg>
    ),
  },
  {
    name: "Svelte",
    color: "#FF3E00",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FF3E00" d="M28.3 6.6C25.7 2.5 20.2.9 16.1 3.5l-8.5 5.2c-1.9 1.2-3.2 3-3.7 5.1-.4 1.7-.2 3.5.6 5a6.7 6.7 0 00-1 2.6c-.5 2.1.1 4.3 1.5 5.9 2.6 3 7.1 4 10.9 2.4l8.4-5.2c1.9-1.2 3.2-3 3.7-5.1.4-1.7.2-3.5-.6-5a7 7 0 001-2.6c.5-2.1-.1-4.3-1.5-5.9v-.3z"/>
        <path fill="#fff" d="M14.2 25.7c-2.2.6-4.5-.4-5.5-2.3a4 4 0 01-.4-3 4 4 0 01.1-.5l.2-.6.5.4c1.1.8 2.4 1.3 3.8 1.5l.4.1-.1.3a1.3 1.3 0 00.8 1.6c.5.1 1-.1 1.3-.5l8.4-5.2a1.3 1.3 0 00.4-1.7 1.3 1.3 0 00-1.7-.4l-3.1 1.9a4.1 4.1 0 01-4.4 0 4 4 0 01-1.4-5.4 3.8 3.8 0 011.6-1.5l8.5-5.2c2.2-1.3 5-.6 6.3 1.6.8 1.4.9 3 .3 4.4l-.2.5-.5-.4c-1.1-.8-2.4-1.3-3.8-1.5l-.4-.1.1-.3a1.3 1.3 0 00-.8-1.6c-.5-.1-1 .1-1.3.5l-8.4 5.2a1.3 1.3 0 00-.4 1.7 1.3 1.3 0 001.7.4l3.1-1.9a4.1 4.1 0 014.4 0 4 4 0 011.4 5.4 3.8 3.8 0 01-1.6 1.5l-8.5 5.2a3.9 3.9 0 01-1.8.5z"/>
      </svg>
    ),
  },
  {
    name: "Tailwind",
    color: "#06B6D4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#06B6D4" d="M16 7c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.91.23 1.56.9 2.28 1.64C17.74 12.9 19.2 14.4 22 14.4c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.91-.23-1.56-.9-2.28-1.64C20.26 8.5 18.8 7 16 7zm-6 9.6c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.91.23 1.56.9 2.28 1.64C11.74 22.5 13.2 24 16 24c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.91-.23-1.56-.9-2.28-1.64C14.26 18.1 12.8 16.6 10 16.6z"/>
      </svg>
    ),
  },
  {
    name: "Bootstrap",
    color: "#7952B3",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="4" fill="#7952B3"/>
        <path fill="#fff" d="M10 8h7.5a5.5 5.5 0 013.5 1 3.5 3.5 0 011.2 2.8 3.8 3.8 0 01-2.2 3.5 4 4 0 012.8 4 4 4 0 01-1.4 3.2 6 6 0 01-4 1.5H10V8zm3 8.5h4a2.5 2.5 0 001.7-.5 1.8 1.8 0 00.6-1.5 1.7 1.7 0 00-.6-1.4A2.6 2.6 0 0017 12.5h-4v4zm0 6.5h4.5a2.7 2.7 0 001.9-.6 2 2 0 00.7-1.6 2 2 0 00-.7-1.6 2.7 2.7 0 00-1.9-.7H13V23z"/>
      </svg>
    ),
  },
  {
    name: "Material UI",
    color: "#007FFF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#007FFF" d="M2 20.5V9l9 5.2v5.2l-4.5-2.6v5.2L2 20.5zm9 5.2l-4.5-2.6v-5.2L11 20v5.7zm0-10.5v-5.2L20 5v5.2l-9 5z"/>
        <path fill="#007FFF" fillOpacity=".6" d="M20 10.2V5l10 5.8v5.2l-5-2.9v5.2l-5-2.9v-5.2z"/>
        <path fill="#007FFF" d="M20 20.5v-5.2l5 2.9v5.2L20 20.5zm5 2.9l-5 2.9v-5.2l5-2.9v5.2z"/>
      </svg>
    ),
  },
  {
    name: "Redux",
    color: "#764ABC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#764ABC" d="M20.53 21.67a3.2 3.2 0 002.68-1.25 3.17 3.17 0 00.46-2.87 12.23 12.23 0 00-1.53-3.46 12.5 12.5 0 01-1.18-2.61c-.33-1.26-.06-2.2.81-2.76a2.89 2.89 0 011.38-.4 3.2 3.2 0 001.7-.53l.07-.05.01-.07a3.23 3.23 0 00-.91-2.55 3.34 3.34 0 00-2.56-.97 3.18 3.18 0 00-2.68 1.25 3.17 3.17 0 00-.46 2.87c.3 1.13.84 2.27 1.53 3.46a12.5 12.5 0 011.18 2.61c.33 1.26.06 2.2-.81 2.76a2.89 2.89 0 01-1.38.4 3.2 3.2 0 00-1.7.53l-.07.05-.01.07a3.23 3.23 0 00.91 2.55 3.34 3.34 0 002.56.97zm-9.06-1.34c.38.66.99 1.11 1.8 1.3a3.17 3.17 0 002.92-.83 3.22 3.22 0 00.66-2.92 12.23 12.23 0 00-1.95-3.2 12.5 12.5 0 01-1.6-2.38c-.6-1.17-.65-2.13-.14-2.84a2.89 2.89 0 011.16-.82c.63-.25 1.12-.65 1.43-1.17l.04-.07-.03-.07a3.23 3.23 0 00-1.87-1.94 3.34 3.34 0 00-2.73.09A3.18 3.18 0 009.79 6.8a3.17 3.17 0 00-.66 2.92c.41 1.09 1.1 2.13 1.95 3.2a12.5 12.5 0 011.6 2.38c.6 1.17.65 2.13.14 2.84a2.89 2.89 0 01-1.16.82c-.63.25-1.12.65-1.43 1.17l-.04.07.03.07c.21.4.47.73.82 1.02h-.03z"/>
      </svg>
    ),
  },
  {
    name: "Framer",
    color: "#0055FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#0055FF" d="M8 8h16v8H16zM8 16h8l8 8H16v-8zM8 24h8v8z"/>
      </svg>
    ),
  },
  {
    name: "GSAP",
    color: "#88CE02",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#0E0E0E"/>
        <path fill="#88CE02" d="M16 6a10 10 0 100 20A10 10 0 0016 6zm0 3a7 7 0 110 14A7 7 0 0116 9zm0 3a4 4 0 100 8 4 4 0 000-8z"/>
        <circle cx="16" cy="16" r="2" fill="#88CE02"/>
      </svg>
    ),
  },
  {
    name: "Expo",
    color: "#aaaaaa",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#aaa" d="M7.97 14.97c3.7-6.4 5.55-9.6 5.55-9.97 0-.6.45-.97 1.2-1.04.58-.06 1.24.24 1.7.74C17 5.3 19.74 10 22.47 14.7c2.78 4.8 4.16 7.2 4.16 7.56 0 .86-.84 1.5-2.25 1.5H7.62c-1.4 0-2.25-.64-2.25-1.5 0-.36 1.26-2.59 2.6-7.29z"/>
      </svg>
    ),
  },
  {
    name: "React Native",
    color: "#61DAFB",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="2.8" fill="#61DAFB"/>
        <ellipse cx="16" cy="16" rx="13" ry="4.5" fill="none" stroke="#61DAFB" strokeWidth="1.4"/>
        <ellipse cx="16" cy="16" rx="13" ry="4.5" fill="none" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(60 16 16)"/>
        <ellipse cx="16" cy="16" rx="13" ry="4.5" fill="none" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(120 16 16)"/>
      </svg>
    ),
  },
  {
    name: "Flutter",
    color: "#54C5F8",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#54C5F8" d="M14.25 3l-11 11 4.5 4.5L18.75 8z"/>
        <path fill="#01579B" d="M7.75 14l4.5 4.5-4.5 4.5 4.5 4.5 11-11-4.5-4.5z"/>
        <path fill="#29B6F6" d="M12.25 18.5l4.5 4.5-4.5 4.5z"/>
      </svg>
    ),
  },

  // ── Backend ───────────────────────────────────────────────────────────────
  {
    name: "Node.js",
    color: "#339933",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#339933" d="M16 2.5L3.5 9.9v14.2L16 31.5l12.5-7.4V9.9L16 2.5zm0 2.6l10 5.9v11.8L16 28.8 6 22.8V11L16 5.1zM12 11v10l2 1.2V14l2 1.2V22l2-1.2V12l-2-1.2v7.2L14 17v-7L12 11z"/>
      </svg>
    ),
  },
  {
    name: "Express.js",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <text x="3" y="21" fill="#fff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">express</text>
        <path fill="#fff" d="M3 24h26v1.5H3z"/>
      </svg>
    ),
  },
  {
    name: "NestJS",
    color: "#E0234E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#E0234E" d="M19.3 5.5c-.3-.2-.7-.2-1 0L10 10.4a1 1 0 00-.5.9v9.4a1 1 0 00.5.9l8.3 4.8a1 1 0 001 0l8.3-4.8a1 1 0 00.5-.9v-9.4a1 1 0 00-.5-.9L19.3 5.5z"/>
        <path fill="#fff" d="M12 18.5l4 2.3 4-2.3V13l-4-2.3L12 13v5.5zm4-5.5l2 1.2v2.6l-2 1.2-2-1.2v-2.6L16 13z"/>
        <path fill="#EA2845" d="M5 8.5C6 6 9 4 12.5 4c2 0 3.5.7 4.5 2l-9 5.2V8.5C8 8.5 6.5 8.5 5 8.5z"/>
      </svg>
    ),
  },
  {
    name: "Python",
    color: "#3776AB",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#3776AB" d="M16 3c-3.7 0-5 1.2-5 3v2h5v1H8C6 9 4.5 10.3 4.5 14c0 3.8 1.5 5 3.5 5h2v-2.5C10 14 11.5 13 14 13h4c2 0 3.5-1.5 3.5-3.5v-3C21.5 4.5 20 3 16 3zm-2 1.5a1 1 0 110 2 1 1 0 010-2z"/>
        <path fill="#FFD43B" d="M16 29c3.7 0 5-1.2 5-3v-2h-5v-1h8c2 0 3.5-1.3 3.5-5 0-3.8-1.5-5-3.5-5h-2v2.5c0 2.5-1.5 3.5-4 3.5h-4c-2 0-3.5 1.5-3.5 3.5v3C10.5 27.5 12 29 16 29zm2-1.5a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
    ),
  },
  {
    name: "FastAPI",
    color: "#009688",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#009688"/>
        <path fill="#fff" d="M17 6l-9 14h8l-1 6 9-14h-8z"/>
      </svg>
    ),
  },
  {
    name: "Django",
    color: "#44B78B",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="4" fill="#092E20"/>
        <path fill="#44B78B" d="M17.5 6h3v14c0 5-2 7-6.5 7l-1-2.5c2.5 0 4.5-.5 4.5-4.5V6zM12.5 6h3v3h-3zm0 5h3v12h-3z"/>
      </svg>
    ),
  },
  {
    name: "Flask",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path stroke="#fff" strokeWidth="1.5" fill="none" d="M13 5h6v4l4 8c.8 1.5 1 3 .4 4.5-.5 1.5-1.8 2.5-3.4 2.5H12c-1.6 0-2.9-1-3.4-2.5-.6-1.5-.4-3 .4-4.5l4-8V5z"/>
        <circle cx="13" cy="17" r="1" fill="#fff"/>
        <circle cx="17" cy="19" r="1" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: "Java",
    color: "#F89820",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#F89820" d="M13 21.5s-1.5.9.9 1.2c2.9.3 4.4.3 7.6-.3 0 0 .8.5 2 1-7.2 3-16.3-.4-10.5-1.9zM12.1 18.3s-1.7 1.3 1 1.5c3.4.4 6.1.4 10.7-.5 0 0 .6.6 1.5.9-9.5 2.8-20 .3-13.2-1.9z"/>
        <path fill="#EA2D2E" d="M18.3 11.5c1.9 2.2-.5 4.2-.5 4.2s4.9-2.5 2.6-5.6c-2.1-3-3.7-4.5 5-9.6 0 0-13.6 3.4-7.1 11z"/>
        <path fill="#F89820" d="M25.8 24.2s1.1.9-1.2 1.6c-4.5 1.3-18.7 1.7-22.7 0-1.4-.6 1.3-1.5 2.1-1.7.9-.2 1.4-.2 1.4-.2-1.6-1.1-10.2 2.2-4.4 3.1 15.9 2.6 29-1.2 24.8-2.8zM13.7 14.9s-7.4 1.7-2.6 2.4c2 .3 6 .2 9.7-.1 3-.3 6.1-.9 6.1-.9s-1.1.5-1.8.9c-7.4 1.9-21.7 1-17.6-.9 3.5-1.6 6.2-1.4 6.2-1.4z"/>
        <path fill="#EA2D2E" d="M20.1 2s4.2 4.2-4 10.7c-6.6 5.2-1.5 8.2 0 11.6-3.9-3.5-6.7-6.5-4.8-9.4 2.8-4.2 10.5-6.2 8.8-12.9z"/>
      </svg>
    ),
  },
  {
    name: "Spring",
    color: "#6DB33F",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#6DB33F" d="M27.8 6.4a13.6 13.6 0 01-1.6 2.5A14 14 0 1016 30a14 14 0 0011.8-21.6zM10.5 25.4a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2zm5.5-3.4c-3.4 0-6.1-1.5-8-3.8l1.5-1.5c1.5 1.9 3.8 3 6.5 3 4.2 0 7-2.8 7-6.5 0-3.2-2.1-5.6-5.2-6.2v-2c4.3.7 7.2 3.8 7.2 8.2 0 5-3.4 8.8-9 8.8z"/>
      </svg>
    ),
  },
  {
    name: "PHP",
    color: "#777BB4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <ellipse cx="16" cy="16" rx="15" ry="9" fill="#777BB4"/>
        <path fill="#fff" d="M9 12h3c2 0 3 1 3 2.5S14 17 12 17h-1.5v3H9V12zm2 1.5v2H12c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1H11zM16 12h3c2 0 3 1 3 2.5S21 17 19 17h-1.5v3H16V12zm2 1.5v2H19c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1h-1zM22.5 12h1.5l-1.5 8h-1.5l.6-3H20l.6-3h1.5l.4-2z"/>
      </svg>
    ),
  },
  {
    name: "Laravel",
    color: "#FF2D20",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FF2D20" d="M28.9 9L24 5.5 19.1 2 16 3.8v3.8L11.1 2 3 6.3v3.8l5 3 .1.1v9.5l8 4.6 8-4.6V13l5-3V9zM21 11l-5 3-5-3v-3l5-3 5 3v3zm-5 4.5l3-1.7 2 1.2v5l-5 2.9-5-2.9v-5l2-1.2 3 1.7z"/>
      </svg>
    ),
  },
  {
    name: "C# .NET",
    color: "#512BD4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#512BD4" d="M16 2L2 9.5v13L16 30l14-7.5v-13L16 2z"/>
        <path fill="#fff" d="M10 12.5c.8-1.5 2.2-2.5 4-2.5 2 0 3.5 1 4.3 2.5H16c-.5-.7-1.2-1-2-1-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5c.8 0 1.5-.3 2-1h2.3c-.8 1.5-2.3 2.5-4.3 2.5-2.7 0-5-2.2-5-5 0-.5.1-1 .3-1.5h-.3zM22 14h1v1h-1zM24 14h1v1h-1zM22 16h3l-.5 1.5H22V16z"/>
      </svg>
    ),
  },
  {
    name: "Go",
    color: "#00ADD8",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#00ADD8" d="M5 13.5c-.3 0-.5-.2-.5-.5v-1c0-.3.2-.5.5-.5h22c.3 0 .5.2.5.5v1c0 .3-.2.5-.5.5H5zm0 3.5c-.3 0-.5-.2-.5-.5v-1c0-.3.2-.5.5-.5h22c.3 0 .5.2.5.5v1c0 .3-.2.5-.5.5H5z"/>
        <circle cx="9" cy="14" r="1.5" fill="#00ADD8"/>
        <circle cx="23" cy="14" r="1.5" fill="#00ADD8"/>
        <path fill="#00ADD8" d="M13 19c0 1.7 1.3 3 3 3s3-1.3 3-3h-2a1 1 0 01-2 0h-2z"/>
        <path stroke="#00ADD8" strokeWidth="1" fill="none" d="M8 11.5s-.5-1.5 0-3 2-2.5 3-2.5M24 11.5s.5-1.5 0-3-2-2.5-3-2.5"/>
      </svg>
    ),
  },
  {
    name: "Rust",
    color: "#CE422B",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="13" fill="none" stroke="#CE422B" strokeWidth="1.5"/>
        <path fill="#CE422B" d="M16 8v2M16 22v2M8 16H6M26 16h-2" stroke="#CE422B" strokeWidth="1.5"/>
        <path fill="#CE422B" d="M11 11l-1.5-1.5M22.5 22.5L21 21M21 11l1.5-1.5M9.5 22.5L11 21" stroke="#CE422B" strokeWidth="1.5"/>
        <rect x="13" y="12" width="6" height="4" rx="1" fill="#CE422B"/>
        <rect x="13" y="17" width="6" height="3" rx="1" fill="#CE422B"/>
        <circle cx="11.5" cy="14" r="1.5" fill="#CE422B"/>
        <circle cx="20.5" cy="14" r="1.5" fill="#CE422B"/>
      </svg>
    ),
  },

  // ── Databases ─────────────────────────────────────────────────────────────
  {
    name: "MySQL",
    color: "#4479A1",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#4479A1" d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12 12-5.4 12-12S22.6 4 16 4z"/>
        <path fill="#fff" d="M11 11h2.5v5.5l4-5.5H20l-4.5 6 5 7h-2.5l-4-5.5V24H11V11z"/>
        <path fill="#F29111" d="M22 9c1.5 0 2.5.8 2.5 2s-1 2-2.5 2-2.5-.8-2.5-2 1-2 2.5-2z"/>
      </svg>
    ),
  },
  {
    name: "PostgreSQL",
    color: "#336791",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#336791" d="M23.5 3.5A11 11 0 0016 6a11 11 0 00-7.5-2.5C5 3.5 3 7 3 10s2 6.5 5 7c.4.1.8.1 1 0v6.5c0 1 .5 2 1.5 2H21c1 0 1.5-1 1.5-2V17c.3.1.7.1 1 0 3-.5 5-3.5 5-7s-2-6.5-5-6.5z"/>
        <path fill="#fff" d="M16 8c-1 0-2 .5-2.5 1.5-.5 1-.5 2.5 0 3.5.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5c.5-1 .5-2.5 0-3.5C18 8.5 17 8 16 8z"/>
        <circle cx="16" cy="11" r="1" fill="#336791"/>
        <path fill="#fff" d="M10 16.5v4.5h2v-4c0-.5.5-1 1-1h6c.5 0 1 .5 1 1v4h2V17h-1v-3.5c-1 .7-2 1-3 1s-2-.3-3-1V17H10v-.5z"/>
      </svg>
    ),
  },
  {
    name: "MongoDB",
    color: "#47A248",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#47A248" d="M16 3c-1 6.5-6 10-6 15 0 3.3 2.7 6 6 6s6-2.7 6-6c0-5-5-8.5-6-15z"/>
        <path fill="#A3A3A3" d="M16.5 3.5v20.3l.5-.2V3.5z"/>
        <path fill="#499D4A" d="M16 24v4c1.5-.5 2.5-2 2.5-3.5 0-3.5-2.5-5.5-2.5-5.5v5z"/>
      </svg>
    ),
  },
  {
    name: "Redis",
    color: "#DC382D",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <ellipse cx="16" cy="22" rx="11" ry="4" fill="#A41E11"/>
        <ellipse cx="16" cy="22" rx="11" ry="4" fill="none" stroke="#DC382D" strokeWidth=".5"/>
        <path fill="#DC382D" d="M5 16v6c0 2.2 4.9 4 11 4s11-1.8 11-4v-6c0 2.2-4.9 4-11 4S5 18.2 5 16z"/>
        <ellipse cx="16" cy="16" rx="11" ry="4" fill="#DC382D"/>
        <path fill="#DC382D" d="M5 10v6c0 2.2 4.9 4 11 4s11-1.8 11-4v-6c0 2.2-4.9 4-11 4S5 12.2 5 10z"/>
        <ellipse cx="16" cy="10" rx="11" ry="4" fill="#DC382D"/>
        <path fill="#FF6B6B" d="M12 7.5l2.5 1.5 1-1.5 1 1.5 2.5-1.5-1.5 2.5 2 .5-2.5 1-1 1.5-1-1.5-2.5-1 2-.5z"/>
      </svg>
    ),
  },
  {
    name: "Firebase",
    color: "#FFCA28",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FFA000" d="M5 25L8.3 8.6l5.5 5.9z"/>
        <path fill="#F57C00" d="M19.5 13.8l-3.5-7.8-11 19z"/>
        <path fill="#FFCA28" d="M27 25L19.5 8l-5 8 7 9zM5 25h22L16 17z"/>
      </svg>
    ),
  },
  {
    name: "Supabase",
    color: "#3ECF8E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <defs>
          <linearGradient id="sb-g1" x1="14" y1="3.5" x2="14" y2="28.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#249361"/>
            <stop offset="1" stopColor="#3ECF8E"/>
          </linearGradient>
        </defs>
        <path fill="url(#sb-g1)" d="M17.5 3.5l-13 17h8v8l13-17h-8z"/>
      </svg>
    ),
  },
  {
    name: "SQLite",
    color: "#0F80CC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#0F80CC" d="M27 6c-2-2.5-5-2-6.5-.5-2 2-6 3-6 8 0 2.5 1 5 3 6.5L20 18c-1.5-1-2.5-2.5-2.5-4.5 0-5 3.5-6 6-9C24.5 3.5 26.5 3 28 4.5l-1 1.5z"/>
        <path fill="#003B57" d="M19 23C13 22.5 9 19 9 14 9 8 13 5 16 5l-.5 2C13 7.5 11 10 11 14c0 4 3 7 7 7.5l1 1.5z"/>
      </svg>
    ),
  },
  {
    name: "Oracle",
    color: "#F80000",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#F80000" d="M7 10h18a6 6 0 010 12H7A6 6 0 017 10zm0 3a3 3 0 000 6h18a3 3 0 000-6H7z"/>
      </svg>
    ),
  },
  {
    name: "MS SQL",
    color: "#CC2927",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <ellipse cx="16" cy="9" rx="11" ry="4.5" fill="#CC2927"/>
        <path fill="#CC2927" d="M5 9v5c0 2.5 4.9 4.5 11 4.5S27 16.5 27 14V9c0 2.5-4.9 4.5-11 4.5S5 11.5 5 9z"/>
        <path fill="#a01e1e" d="M5 14v5c0 2.5 4.9 4.5 11 4.5S27 21.5 27 19v-5c0 2.5-4.9 4.5-11 4.5S5 16.5 5 14z"/>
        <ellipse cx="16" cy="9" rx="11" ry="4.5" fill="none" stroke="#a01e1e" strokeWidth="0.5"/>
      </svg>
    ),
  },

  // ── Cloud & DevOps ────────────────────────────────────────────────────────
  {
    name: "AWS",
    color: "#FF9900",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FF9900" d="M9.5 19.5l-1.5-.5V16l1.5-.5 1 .5.5 1.5-.5 1.5zM20 20l2-.5.5-1.5-.5-1.5-2-.5-1.5.5L18 18l.5 1.5z"/>
        <path fill="#FF9900" d="M10 12.5c0-3 2.5-5.5 6-5.5 2.5 0 4.5 1.3 5.5 3.2.5-.2 1-.2 1.5-.2 2.5 0 4.5 2 4.5 4.5 0 2-1.3 3.7-3 4.3M10 12.5c-.5.2-1 .2-1.5.2C6 12.7 4 14.7 4 17.2c0 2.3 1.7 4.1 4 4.5"/>
        <path fill="#FF9900" d="M6 25.5l4-2.5M26 25.5l-4-2.5M16 26v-3"/>
        <path stroke="#FF9900" strokeWidth="1.5" fill="none" d="M9 23c2 1.5 4.5 2.5 7 2.5s5-1 7-2.5"/>
      </svg>
    ),
  },
  {
    name: "Azure",
    color: "#0078D4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#0078D4" d="M13.5 5L5 25h7.5l7-13.5L13.5 5zM18 13l-3.5 7.5H27L18 13z"/>
      </svg>
    ),
  },
  {
    name: "Google Cloud",
    color: "#4285F4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#EA4335" d="M16 6l4 4h-2.5A6.5 6.5 0 009.5 16h-3A9.5 9.5 0 0116 6z"/>
        <path fill="#4285F4" d="M22.5 10H16l4 4h2.5a3.5 3.5 0 013.5 3.5H29a7 7 0 00-6.5-7.5z"/>
        <path fill="#34A853" d="M25.5 17.5h-3a6.5 6.5 0 01-6.5 5.5v3a9.5 9.5 0 009.5-8.5z"/>
        <path fill="#FBBC05" d="M9.5 16a6.5 6.5 0 006.5 7v-3a3.5 3.5 0 01-3.5-3.5h-3l-3.5-2a9.3 9.3 0 000 2z"/>
        <circle cx="16" cy="16" r="4" fill="#4285F4"/>
      </svg>
    ),
  },
  {
    name: "Docker",
    color: "#2496ED",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#2496ED" d="M28.6 13.6c-.4-3-3-5.1-6-5.1h-.4c-.5-2-2-3.5-4-4l-.7-.5-.4.7c-.5 1-.8 2.1-.8 3.2H7v8A6.5 6.5 0 0013.5 22h5A9 9 0 0028.6 13.6zM13.5 10H16v2h-2.5V10zm-3.5 0H12v2H10V10zM7 12.5H9.5v2H7v-2zm4 4H8.5v-2H11v2zm3 0h-2.5v-2H14v2zm3 0h-2.5v-2H17v2zm1.5-2H21v2h-2.5v-2zm-8 4H10v2H8.5v-2zm3 0H13v2h-2.5v-2z"/>
      </svg>
    ),
  },
  {
    name: "Kubernetes",
    color: "#326CE5",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#326CE5" d="M16 3L3 10v12l13 7 13-7V10L16 3zm0 2.3l10.5 6.1v8.2L16 25.7 5.5 21.6v-8.2L16 5.3z"/>
        <circle cx="16" cy="16" r="2.5" fill="#326CE5"/>
        <path stroke="#326CE5" strokeWidth="1.5" d="M16 13.5V10M19 14.5l3-1.5M19 17.5l3 1.5M16 18.5V22M13 17.5l-3 1.5M13 14.5l-3-1.5"/>
      </svg>
    ),
  },
  {
    name: "Terraform",
    color: "#844FBA",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#844FBA" d="M12 6.5v8l7-4V2.5zM20 11l7 4V7l-7-4zM12 16.5V25l7-4v-8.5zM4 11l7 4V7L4 3z"/>
      </svg>
    ),
  },
  {
    name: "GitHub Actions",
    color: "#2088FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#2088FF" d="M16 2C8.3 2 2 8.3 2 16c0 6.2 4 11.5 9.5 13.4.7.1 1-.3 1-.7v-2.5c-3.9.8-4.7-1.9-4.7-1.9-.6-1.6-1.5-2-1.5-2-1.2-.8.1-.8.1-.8 1.4.1 2.1 1.4 2.1 1.4 1.2 2.1 3.2 1.5 4 1.1.1-.9.5-1.5.9-1.8-3.1-.4-6.4-1.6-6.4-7 0-1.5.5-2.8 1.4-3.8-.1-.4-.6-1.8.1-3.7 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.5 3.3-.5s2.2.2 3.3.5c2.6-1.7 3.7-1.4 3.7-1.4.7 1.9.3 3.3.1 3.7.9 1 1.4 2.3 1.4 3.8 0 5.5-3.3 6.7-6.5 7 .5.4 1 1.3 1 2.6v3.9c0 .4.3.8 1 .7C26 27.5 30 22.2 30 16 30 8.3 23.7 2 16 2z"/>
      </svg>
    ),
  },
  {
    name: "Jenkins",
    color: "#D33833",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <ellipse cx="16" cy="13" rx="10" ry="11" fill="#D33833"/>
        <path fill="#EFC6A0" d="M16 4a9 9 0 00-9 9c0 5 4 9 9 9s9-4 9-9-4-9-9-9z"/>
        <circle cx="13" cy="12" r="1.5" fill="#333"/>
        <circle cx="19" cy="12" r="1.5" fill="#333"/>
        <path stroke="#333" strokeWidth="1.5" fill="none" d="M13 16.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5"/>
        <path fill="#EFC6A0" d="M7 22l1.5 5h15L25 22c-2 2-5 3-9 3s-7-1-9-3z"/>
      </svg>
    ),
  },
  {
    name: "Nginx",
    color: "#009639",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#009639" d="M16 3L3 10.5v11L16 29l13-7.5v-11L16 3zm0 2.3l10.5 6.1v8.2L16 25.7 5.5 21.6v-8.2L16 5.3z"/>
        <path fill="#009639" d="M11 10v12l2-1V13l7 8 2-1V10l-2 1v8l-7-8z"/>
      </svg>
    ),
  },
  {
    name: "Linux",
    color: "#FCC624",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FCC624" d="M16 2c-2 0-3.5 2.5-3.5 7 0 2 .5 4 1 5.5C10 15.5 8 17.5 8 20c0 2 1 3.5 2.5 4.5-.5.5-1 1.5-1 2.5s.5 1.5 1 2l.5.5H21l.5-.5c.5-.5 1-1 1-2s-.5-2-1-2.5C23 23.5 24 22 24 20c0-2.5-2-4.5-5.5-5.5.5-1.5 1-3.5 1-5.5C19.5 4.5 18 2 16 2z"/>
        <circle cx="14" cy="11" r="1" fill="#333"/>
        <circle cx="18" cy="11" r="1" fill="#333"/>
        <path stroke="#333" strokeWidth="1" fill="none" d="M14 15s.5 1.5 2 1.5 2-1.5 2-1.5"/>
      </svg>
    ),
  },
  {
    name: "Vercel",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#fff" d="M16 5L30 27H2z"/>
      </svg>
    ),
  },
  {
    name: "Netlify",
    color: "#00C7B7",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#00C7B7" d="M11.5 19h9v1.5h-9zM10 17.5l-5-5 5-5 1 1-4 4 4 4zM22 17.5l-1-1 4-4-4-4 1-1 5 5z"/>
        <path fill="#00C7B7" d="M13.5 8l5 16-1.5.5-5-16zM16 6a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16 23a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
      </svg>
    ),
  },
  {
    name: "DigitalOcean",
    color: "#0080FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#0080FF" d="M16 3C8.8 3 3 8.8 3 16c0 7.2 5.8 13 13 13a13 13 0 001-26zm0 20v-4h4v-4h4a8 8 0 11-8 8zm-3 .5h-3v3h3v-3zm-4.5-1.5h-2.5v2.5h2.5V22z"/>
      </svg>
    ),
  },

  // ── AI / ML ───────────────────────────────────────────────────────────────
  {
    name: "OpenAI",
    color: "#10A37F",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#10A37F" d="M28.1 12.8a7.7 7.7 0 00-.5-6.3A8 8 0 0019.9 3a7.7 7.7 0 00-5.8 2.7 7.7 7.7 0 00-6.2 3.7 8 8 0 001 9.4 7.7 7.7 0 00.5 6.3 8 8 0 007.7 3.5 7.7 7.7 0 005.8-2.7 7.7 7.7 0 006.2-3.7 8 8 0 00-1-9.4zM19 24.4a5.4 5.4 0 01-3.5-1.3l.2-.1 5.8-3.4a.9.9 0 00.5-.8v-8.3l2.5 1.4v6.8A5.4 5.4 0 0119 24.4zm-11.6-5A5.4 5.4 0 017 15c0-1.3.5-2.5 1.2-3.4v6.8c0 .3.2.6.5.8l5.8 3.4-.2.1-2.5-1.4a5.4 5.4 0 01-4.4-2.3zM6.6 10.5l2.5 1.4V18l-2.5-1.4V10.5zm10.9 9.5l-2.5-1.4V12l2.5 1.4v6.6zm2.2-9.5v-1.3A5.4 5.4 0 0123 13v.1l-2.5 1.4V12a.9.9 0 00-.4-.8l-5.8-3.3.2-.1 2.5 1.4 2.7 1.8zm-9.6 0L13 8.5l2.5-1.4L18 8.5v1.3L15.5 11l-2.5-1.4V10.5h-2.9z"/>
      </svg>
    ),
  },
  {
    name: "Claude",
    color: "#D97757",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="13" fill="#D97757"/>
        <path stroke="#fff" strokeWidth="2" fill="none" d="M12 21l4-10 4 10"/>
        <path stroke="#fff" strokeWidth="2" d="M13.5 18h5"/>
      </svg>
    ),
  },
  {
    name: "Gemini",
    color: "#4285F4",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <defs>
          <linearGradient id="gem-g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4285F4"/>
            <stop offset="100%" stopColor="#1A73E8"/>
          </linearGradient>
        </defs>
        <path fill="url(#gem-g1)" d="M16 3c0 0-8 6-8 13s8 13 8 13 8-6 8-13S16 3 16 3zM3 16c0 0 6-8 13-8s13 8 13 8-6 8-13 8S3 16 3 16z"/>
      </svg>
    ),
  },
  {
    name: "LangChain",
    color: "#7CB9A8",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#1C3C3C"/>
        <rect x="6" y="12" width="8" height="8" rx="2" fill="none" stroke="#7CB9A8" strokeWidth="1.5"/>
        <rect x="18" y="12" width="8" height="8" rx="2" fill="none" stroke="#7CB9A8" strokeWidth="1.5"/>
        <path stroke="#7CB9A8" strokeWidth="1.5" d="M14 16h4"/>
        <circle cx="10" cy="16" r="1.5" fill="#7CB9A8"/>
        <circle cx="22" cy="16" r="1.5" fill="#7CB9A8"/>
      </svg>
    ),
  },
  {
    name: "LlamaIndex",
    color: "#C76BF0",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="13" fill="#1A0533"/>
        <path fill="#C76BF0" d="M10 23c0-4 3-8 6-10 3 2 6 6 6 10H10z"/>
        <circle cx="16" cy="10" r="3" fill="#C76BF0"/>
      </svg>
    ),
  },
  {
    name: "Hugging Face",
    color: "#FFD21E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="14" r="11" fill="#FFD21E"/>
        <circle cx="13" cy="12" r="1.5" fill="#333"/>
        <circle cx="19" cy="12" r="1.5" fill="#333"/>
        <path stroke="#333" strokeWidth="1.5" fill="none" d="M12 17s1 3 4 3 4-3 4-3"/>
        <path fill="#FF8C00" d="M12 26c-1-1-2-2.5-2-4h12c0 1.5-1 3-2 4C17 27.5 12 26 12 26z"/>
      </svg>
    ),
  },
  {
    name: "TensorFlow",
    color: "#FF6F00",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#FF6F00" d="M16 3L4 9.5v13L16 29l12-7.5v-13L16 3zm0 2.3l10 6.1v10.2L16 27.7 6 21.6V11.4L16 5.3z"/>
        <path stroke="#FF6F00" strokeWidth="1.5" d="M16 10v12M10.5 13l5.5-3 5.5 3M10.5 19l5.5 3 5.5-3"/>
      </svg>
    ),
  },
  {
    name: "PyTorch",
    color: "#EE4C2C",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#EE4C2C" d="M22.5 7.5L16 4 9.5 7.5 4 14a12 12 0 1024 0l-5.5-6.5z"/>
        <circle cx="20" cy="11" r="2" fill="#fff"/>
        <path stroke="#fff" strokeWidth="1.5" fill="none" d="M16 8v12M11 13l5-3 5 3"/>
      </svg>
    ),
  },
  {
    name: "Scikit-learn",
    color: "#F7931E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="13" fill="#F7931E"/>
        <circle cx="16" cy="16" r="7" fill="#3498DB"/>
        <circle cx="16" cy="16" r="3" fill="#F7931E"/>
      </svg>
    ),
  },
  {
    name: "Pandas",
    color: "#E70488",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="4" fill="#150458"/>
        <rect x="9.5" y="6" width="4" height="20" rx="2" fill="#E70488"/>
        <rect x="18.5" y="6" width="4" height="20" rx="2" fill="#E70488"/>
        <rect x="9.5" y="13" width="13" height="3" rx="1.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: "NumPy",
    color: "#4DABCF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#4DABCF" d="M16 3L7 8v10l9 5 9-5V8z"/>
        <path fill="#013243" d="M16 10L9 14v6l7 4 7-4v-6z"/>
        <path fill="#4DABCF" d="M16 12l-5 3v4l5 3 5-3v-4z"/>
      </svg>
    ),
  },
  {
    name: "MLflow",
    color: "#0194E2",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path stroke="#0194E2" strokeWidth="2" fill="none" d="M4 20c4-8 8-12 12-12s8 4 12 12"/>
        <path stroke="#0194E2" strokeWidth="1.5" fill="none" d="M8 20a8 8 0 1116 0"/>
        <circle cx="16" cy="20" r="3" fill="#0194E2"/>
      </svg>
    ),
  },
  {
    name: "DVC",
    color: "#945DD6",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="5" fill="#945DD6"/>
        <path fill="#fff" d="M7 11h6l3 5-3 5H7l3-5zM19 11h6v10h-6v-3h3v-4h-3z"/>
      </svg>
    ),
  },
  {
    name: "Apache Spark",
    color: "#E25A1C",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#E25A1C" d="M16 3l2.5 7.5H26l-6.5 4.5 2.5 7.5-6-4.5-6 4.5 2.5-7.5L6 10.5h7.5z"/>
      </svg>
    ),
  },
  {
    name: "Kafka",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="4" fill="#231F20"/>
        <circle cx="16" cy="8" r="2.5" fill="#fff"/>
        <circle cx="9" cy="22" r="2.5" fill="#fff"/>
        <circle cx="23" cy="22" r="2.5" fill="#fff"/>
        <path stroke="#fff" strokeWidth="1.5" d="M16 10.5v5M16 15.5l-7 4.5M16 15.5l7 4.5"/>
      </svg>
    ),
  },
  {
    name: "Airflow",
    color: "#017CEE",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#017CEE" d="M16 4c-2.8 3.5-5 7-5 10a5 5 0 0010 0c0-3-2.2-6.5-5-10z"/>
        <path fill="#017CEE" d="M4 14c3.5 2.8 7 5 10 5a5 5 0 000-10C11 9 7.5 11.2 4 14z"/>
        <path fill="#00AD46" d="M28 14c-3.5 2.8-7 5-10 5a5 5 0 010-10c3 0 6.5 2.2 10 5z"/>
        <path fill="#E43921" d="M16 28c2.8-3.5 5-7 5-10a5 5 0 00-10 0c0 3 2.2 6.5 5 10z"/>
      </svg>
    ),
  },

  // ── Design ────────────────────────────────────────────────────────────────
  {
    name: "Figma",
    color: "#F24E1E",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#F24E1E" d="M11 4h5v8h-5a4 4 0 010-8z"/>
        <path fill="#FF7262" d="M16 4h5a4 4 0 010 8h-5V4z"/>
        <path fill="#A259FF" d="M16 12h5a4 4 0 010 8h-5v-8z"/>
        <path fill="#1ABCFE" d="M16 20a4 4 0 118 0 4 4 0 01-8 0z"/>
        <path fill="#0ACF83" d="M11 12h5v8h-5a4 4 0 010-8z"/>
      </svg>
    ),
  },
  {
    name: "Adobe XD",
    color: "#FF61F6",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#470137"/>
        <path fill="#FF61F6" d="M19.5 10l-4 6 4 6h-3l-2.5-4-2.5 4h-3l4-6-4-6h3l2.5 4 2.5-4z"/>
        <path fill="#FF61F6" d="M22 10h2.5v7.5c0 1.5.5 2.5 2.5 2.5v2.5c-3.5 0-5-1.5-5-5V10z"/>
      </svg>
    ),
  },
  {
    name: "Photoshop",
    color: "#31A8FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#001E36"/>
        <path fill="#31A8FF" d="M7 9h5c3 0 5 1.5 5 4.5S15 18 12 18H10v5H7V9zm3 2.5v4h2c1.5 0 2-.8 2-2s-.5-2-2-2H10zm9 9l-1-2.5c1.5-.5 2.5-1.5 2.5-3 0-1.5-1-2.5-2.5-2.5h-1V10h1c3 0 5 1.5 5 4 0 2-1 3.5-3 4.5l2 4.5h-3z"/>
      </svg>
    ),
  },
  {
    name: "Illustrator",
    color: "#FF9A00",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#300D00"/>
        <path fill="#FF9A00" d="M9.5 22l1-3h5l1 3h3L14 9h-4L5.5 22zM12 12.5L14 18h-4l2-5.5zm10-3.5h3v13h-3V9zm0-3.5h3V9h-3z"/>
      </svg>
    ),
  },
  {
    name: "After Effects",
    color: "#9999FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#00005B"/>
        <path fill="#9999FF" d="M7 22l1-3h5l1 3h3L11.5 9h-3L4 22zm2.5-5.5L11.5 11l2 5.5zM18 9h9v2.5h-6v3h5V17h-5v2.5h6V22h-9V9z"/>
      </svg>
    ),
  },
  {
    name: "Premiere Pro",
    color: "#9999FF",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#00005B"/>
        <path fill="#9999FF" d="M7 9h5c3 0 5 1.5 5 4.5S15 18 12 18H10v5H7V9zm3 2.5v4h2c1.5 0 2-.8 2-2s-.5-2-2-2H10zm10-2.5h5c3 0 5 1.5 5 4.5S23 18 20 18h-2v5h-3V9zm3 2.5v4h2c1.5 0 2-.8 2-2s-.5-2-2-2h-2z"/>
      </svg>
    ),
  },
  {
    name: "Canva",
    color: "#00C4CC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#00C4CC"/>
        <path fill="#fff" d="M16 8a8 8 0 00-8 8c0 2 .7 3.8 2 5.2l1.5-1.5A6 6 0 1122 16h2a8 8 0 00-8-8zm0 4a4 4 0 00-4 4c0 1 .4 2 1 2.8l1.5-1.5A2 2 0 1118 16h2a4 4 0 00-4-4z"/>
      </svg>
    ),
  },
  {
    name: "Blender",
    color: "#F5792A",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="18" r="7" fill="none" stroke="#F5792A" strokeWidth="2"/>
        <circle cx="16" cy="18" r="3" fill="#F5792A"/>
        <path fill="#265787" d="M8 7h16l-8 8z"/>
        <path fill="#F5792A" d="M8 7c0 0-2 3 0 7h16c2-4 0-7 0-7"/>
        <path stroke="#F5792A" strokeWidth="1.5" d="M16 14v-7"/>
      </svg>
    ),
  },
  {
    name: "Android Studio",
    color: "#3DDC84",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#3DDC84" d="M6 11l4 7h12l4-7a10 10 0 01-20 0z"/>
        <path fill="#3DDC84" d="M9 5l2.5 4H20.5l2.5-4c-2-2-4.5-3-7-3s-5 1-7 3z"/>
        <circle cx="12" cy="14" r="1.5" fill="#fff"/>
        <circle cx="20" cy="14" r="1.5" fill="#fff"/>
        <path stroke="#3DDC84" strokeWidth="1.5" d="M8.5 4.5l-2-3.5M23.5 4.5l2-3.5"/>
      </svg>
    ),
  },
  {
    name: "Xcode",
    color: "#147EFB",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <defs>
          <linearGradient id="xc-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#147EFB"/>
            <stop offset="100%" stopColor="#1BCFF4"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill="url(#xc-g1)"/>
        <path fill="#fff" d="M9 16l4-6 2 3-2 3 2 3-4-3zm14 0l-4 6-2-3 2-3-2-3 4 3z"/>
      </svg>
    ),
  },

  // ── Tools ─────────────────────────────────────────────────────────────────
  {
    name: "Git",
    color: "#F05032",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#F05032" d="M29.5 14.8L17.2 2.5a1.7 1.7 0 00-2.4 0l-2.4 2.4 3 3A2 2 0 0118 11v10a2 2 0 11-2-2V11.8L13 8.7a2 2 0 00-2.9 2.8l.1.1v10.5a2 2 0 101.9 1.9H12c.5 0 1-.1 1.5-.4l9.5-9.5a2.5 2.5 0 012 0l4.5 4.5a1.7 1.7 0 000-2.4l.2-.2z"/>
      </svg>
    ),
  },
  {
    name: "GitHub",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#fff" d="M16 2C8.3 2 2 8.3 2 16c0 6.2 4 11.5 9.5 13.4.7.1 1-.3 1-.7v-2.5c-3.9.8-4.7-1.9-4.7-1.9-.6-1.6-1.5-2-1.5-2-1.2-.8.1-.8.1-.8 1.4.1 2.1 1.4 2.1 1.4 1.2 2.1 3.2 1.5 4 1.1.1-.9.5-1.5.9-1.8-3.1-.4-6.4-1.6-6.4-7 0-1.5.5-2.8 1.4-3.8-.1-.4-.6-1.8.1-3.7 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.5 3.3-.5s2.2.2 3.3.5c2.6-1.7 3.7-1.4 3.7-1.4.7 1.9.3 3.3.1 3.7.9 1 1.4 2.3 1.4 3.8 0 5.5-3.3 6.7-6.5 7 .5.4 1 1.3 1 2.6v3.9c0 .4.3.8 1 .7C26 27.5 30 22.2 30 16 30 8.3 23.7 2 16 2z"/>
      </svg>
    ),
  },
  {
    name: "Postman",
    color: "#FF6C37",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#FF6C37"/>
        <path fill="#fff" d="M22 11l-9 9M13 11h9v9"/>
        <circle cx="13" cy="20" r="2" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: "VS Code",
    color: "#007ACC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#007ACC" d="M30 8.5L22.5 3 12 13.5l-7-5.5L3 10v12l2 2 7-5.5L22.5 29l7.5-5.5V8.5zM22.5 23.5L14.5 16l8-7.5v15z"/>
      </svg>
    ),
  },
  {
    name: "Notion",
    color: "#ffffff",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#fff" d="M8 6h12l6 7v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7a1 1 0 011-1zm0 2v18h16V14h-5a1 1 0 01-1-1V8H8zm11 0v4h4l-4-4z"/>
        <path fill="#fff" d="M11 16h10v1.5H11zM11 19.5h7v1.5h-7z"/>
      </svg>
    ),
  },
  {
    name: "Slack",
    color: "#4A154B",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <path fill="#E01E5A" d="M8.5 19.5a3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3H8.5v3zm1.5 0a3 3 0 013-3 3 3 0 013 3v7.5a3 3 0 01-3 3 3 3 0 01-3-3V19.5z"/>
        <path fill="#36C5F0" d="M12.5 8.5a3 3 0 01-3-3 3 3 0 013-3 3 3 0 013 3V8.5h-3zm0 1.5a3 3 0 013 3 3 3 0 01-3 3H5a3 3 0 01-3-3 3 3 0 013-3h7.5z"/>
        <path fill="#2EB67D" d="M23.5 12.5a3 3 0 013 3 3 3 0 01-3 3H23.5v-3a3 3 0 00-3-3 3 3 0 013 3zm-1.5 0a3 3 0 01-3-3 3 3 0 013-3 3 3 0 013 3v7.5a3 3 0 01-3 3 3 3 0 01-3-3V12.5z"/>
        <path fill="#ECB22E" d="M19.5 23.5a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3V23.5h3zm0-1.5a3 3 0 01-3-3 3 3 0 013-3H27a3 3 0 013 3 3 3 0 01-3 3H19.5z"/>
      </svg>
    ),
  },
  {
    name: "Jira",
    color: "#0052CC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <defs>
          <linearGradient id="jira-g1" x1="16" y1="16" x2="4" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0052CC"/>
            <stop offset="100%" stopColor="#2684FF"/>
          </linearGradient>
        </defs>
        <path fill="url(#jira-g1)" d="M28 16L16 4 4 16l12 12 4.5-4.5-7-7.5 7.5-7.5L28 16z"/>
        <path fill="#2684FF" d="M16 4L28 16l-4.5 4.5-7.5-7.5L16 4z"/>
      </svg>
    ),
  },
  {
    name: "Trello",
    color: "#0052CC",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect width="32" height="32" rx="6" fill="#0052CC"/>
        <rect x="5" y="6" width="9" height="15" rx="2" fill="#fff"/>
        <rect x="18" y="6" width="9" height="10" rx="2" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: "ClickUp",
    color: "#7B68EE",
    svg: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <defs>
          <linearGradient id="cu-g1" x1="5" y1="24.5" x2="27" y2="24.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8930FD"/>
            <stop offset="1" stopColor="#49CCF9"/>
          </linearGradient>
          <linearGradient id="cu-g2" x1="5" y1="16" x2="27" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF02F0"/>
            <stop offset="1" stopColor="#FFC800"/>
          </linearGradient>
        </defs>
        <path fill="url(#cu-g1)" d="M5 21l4.5-3.5C10.8 20 13 21 16 21s5.2-1 6.5-3.5L27 21C25 25.5 21 28 16 28S7 25.5 5 21z"/>
        <path fill="url(#cu-g2)" d="M5 15l4.5 3.5C11 15.5 13.5 14 16 14s5 1.5 6.5 4.5L27 15 16 4 5 15z"/>
      </svg>
    ),
  },
];

// ─── Styles (must be defined before components that use it) ────────────────
const STYLES = `
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

/* Particles */
.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  animation: particleFloat linear infinite;
  will-change: transform, opacity;
}
@keyframes particleFloat {
  0%   { opacity: 0;   transform: translateY(0) scale(0); }
  10%  { opacity: 1;   transform: translateY(-20px) scale(1); }
  90%  { opacity: .6;  transform: translateY(-120px) scale(.8); }
  100% { opacity: 0;   transform: translateY(-160px) scale(0); }
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
.marquee-row { overflow: hidden; width: 100%; }

/* Track */
.marquee-track {
  display: flex;
  gap: 1rem;
  width: max-content;
  animation: marqueeLeft linear infinite;
  will-change: transform;
}
.marquee-track--reverse { animation-name: marqueeRight; }

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
  transition: border-color .25s ease, box-shadow .25s ease;
}
.tech-card:hover {
  border-color: color-mix(in srgb, var(--card-color) 55%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--card-color) 35%, transparent),
    0 8px 40px color-mix(in srgb, var(--card-color) 28%, transparent),
    0 20px 60px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.12);
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

/* Responsive */
@media (max-width: 768px) {
  .tech-section { padding: 4rem 0 5rem; }
  .tech-card { width: 118px; height: 86px; }
  .tech-card__label { font-size: .61rem; }
  .marquee-container {
    mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
  }
}
@media (max-width: 480px) {
  .tech-card { width: 102px; height: 78px; }
}
`;

// ─── Distribute technologies across rows ────────────────────────────────────
const NUM_ROWS = 5;

function distributeRows(items: Technology[], numRows: number): Technology[][] {
  const rows: Technology[][] = Array.from({ length: numRows }, () => []);
  items.forEach((item, i) => rows[i % numRows].push(item));
  return rows;
}

// ─── Individual card ────────────────────────────────────────────────────────
function TechCard({ tech }: { tech: Technology }) {
  return (
    <motion.div
      className="tech-card"
      style={{ "--card-color": tech.color } as React.CSSProperties}
      whileHover={{ scale: 1.08, y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
      aria-label={tech.name}
    >
      <div className="tech-card__shimmer" />
      <div className="tech-card__glow" />
      <div className="tech-card__icon">{tech.svg}</div>
      <span className="tech-card__label">{tech.name}</span>
    </motion.div>
  );
}

// ─── Marquee row ────────────────────────────────────────────────────────────
function MarqueeRow({ items, direction, speed = 40 }: { items: Technology[]; direction: "left" | "right"; speed?: number }) {
  const [isPaused, setIsPaused] = useState(false);
  const doubled = [...items, ...items, ...items];

  return (
    <div
      className="marquee-row"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`marquee-track${direction === "right" ? " marquee-track--reverse" : ""}`}
        style={{ animationDuration: `${speed}s`, animationPlayState: isPaused ? "paused" : "running" }}
      >
        {doubled.map((tech, idx) => (
          <TechCard key={`${tech.name}-${idx}`} tech={tech} />
        ))}
      </div>
    </div>
  );
}

// ─── Floating particle ──────────────────────────────────────────────────────
function Particle({ x, y, size, duration, delay, color }: { x: number; y: number; size: number; duration: number; delay: number; color: string }) {
  return (
    <div
      className="particle"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    />
  );
}

// ─── Main section ───────────────────────────────────────────────────────────
export default function TechMarquee() {
  const rows = distributeRows(techs, NUM_ROWS);
  const sectionRef = useRef<HTMLElement>(null);

  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      color: i % 3 === 0 ? "rgba(37,99,235,0.55)" : i % 3 === 1 ? "rgba(124,58,237,0.55)" : "rgba(6,182,212,0.45)",
    }))
  ).current;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 35);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 35);
  }, [mouseX, mouseY]);

  const speeds = [42, 56, 48, 62, 52];

  return (
    <>
      <style>{STYLES}</style>
      <section id="technologies" ref={sectionRef} className="tech-section" onMouseMove={handleMouseMove}>
        {/* Blobs */}
        <motion.div className="blob blob--blue" style={{ x: mouseX, y: mouseY }} />
        <motion.div className="blob blob--purple" style={{ x: mouseX, y: mouseY }} />
        <motion.div className="blob blob--cyan" style={{ x: mouseX, y: mouseY }} />

        {/* Grid */}
        <div className="tech-grid" />

        {/* Particles */}
        {particles.map((p) => <Particle key={p.id} {...p} />)}

        {/* Header */}
        <div className="tech-header">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="tech-header__badge"
          >
            <span className="badge-dot" />
            Our Tech Stack
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="tech-header__title"
          >
            Technologies <span className="gradient-text">We Use</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="tech-header__subtitle"
          >
            Explore the trusted technologies, frameworks, cloud platforms, AI tools, and software we use to build
            fast, scalable, secure, and future-ready digital products.
          </motion.p>
        </div>

        {/* Marquee rows */}
        <div className="marquee-container">
          {rows.map((row, i) => (
            <MarqueeRow key={i} items={row} direction={i % 2 === 0 ? "left" : "right"} speed={speeds[i]} />
          ))}
        </div>

        {/* Bottom fade */}
        <div className="tech-fade-bottom" />
      </section>
    </>
  );
}

