"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Quote } from "lucide-react";

export default function FounderMessage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-surface to-background py-20 md:py-32">
      {/* Background Blur */}
      <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-electric-cyan/10 blur-[100px] md:left-20 md:top-20 md:h-72 md:w-72" />
      <div className="absolute right-10 bottom-10 h-48 w-48 rounded-full bg-purple/10 blur-[100px] md:right-20 md:bottom-20 md:h-72 md:w-72" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex rounded-full border border-electric-cyan/30 bg-electric-cyan/10 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-electric-cyan"
            >
              Founder Message
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-6xl"
            >
              A Message From Our
              <span className="bg-gradient-to-r from-electric-cyan to-purple bg-clip-text text-transparent">
                {" "}
                Founder
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 space-y-6 text-base leading-relaxed text-gray-400 md:text-lg"
            >
              <p>
                Every successful business starts with one thing:
                <span className="font-semibold text-white">
                  {" "}
                  consistent growth.
                </span>{" "}
                Growth comes from attracting the right audience, building trust,
                and converting visitors into loyal customers.
              </p>

              <p>
                At <strong className="text-electric-cyan">ZenFix</strong>, we believe
                that marketing is not about spending more money—it is about
                creating measurable results through data-driven strategies,
                creative branding, and cutting-edge technology.
              </p>

              <p>
                Whether it's SEO, Paid Advertising, Social Media Management,
                Website Development, Mobile Apps, or Lead Generation, our
                mission is simple:
              </p>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border border-electric-cyan/20 bg-white/5 p-6 backdrop-blur-lg transition-all duration-300"
              >
                <p className="text-lg md:text-xl font-semibold text-white italic">
                  "Helping businesses grow faster, smarter, and stronger through
                  digital innovation."
                </p>
              </motion.div>

              <p>
                Thank you for trusting ZenFix. Together, we'll build brands that
                inspire, convert, and lead the future.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-10"
            >
              <h4 className="text-xl font-bold text-white md:text-2xl">
                — Founder & CEO
              </h4>
              <p className="text-electric-cyan">
                ZenFix Digital Marketing Agency
              </p>
            </motion.div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto flex justify-center"
          >
            {/* Glow */}
            <div className="absolute h-[350px] w-[280px] rounded-[40px] bg-gradient-to-br from-electric-cyan/20 to-purple/20 blur-3xl md:h-[500px] md:w-[380px]" />

            <div className="relative">
              {/* Founder Image */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="overflow-hidden rounded-[30px] border border-white/10 bg-surface shadow-2xl transition duration-500 md:rounded-[40px]"
              >
                <Image
                  src="/projects/ZENFIXIN LOGO 2.png"
                  alt="Founder"
                  width={500}
                  height={650}
                  className="h-[400px] w-[280px] object-cover md:h-[580px] md:w-[420px]"
                />
              </motion.div>

              {/* Quote Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl bg-gradient-to-r from-electric-cyan to-purple p-4 shadow-2xl md:-bottom-8 md:w-[90%] md:p-6 md:rounded-3xl"
              >
                <div className="absolute -top-4 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg md:-top-6 md:h-14 md:w-14">
                  <Quote className="h-5 w-5 text-electric-cyan md:h-7 md:w-7" />
                </div>

                <h3 className="mt-2 text-center text-base font-bold text-white md:mt-4 md:text-xl">
                  "Marketing + Technology = Business Growth"
                </h3>

                <p className="mt-2 text-center text-white/90 text-sm md:mt-3">
                  We don't just create campaigns.
                </p>

                <p className="text-center text-white/90 text-sm">
                  We build businesses that dominate online.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
