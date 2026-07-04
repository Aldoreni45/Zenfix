"use client";

import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Target,
  Rocket,
} from "lucide-react";

const process = [
  {
    id: "01",
    title: "Book a Free Strategy Call",
    description:
      "Tell us about your business, your goals, and the challenges you're facing. We'll understand exactly where you are today.",
    icon: BriefcaseBusiness,
  },
  {
    id: "02",
    title: "Get a Personalized Growth Plan",
    description:
      "Our experts analyze your business, competitors, and audience to build a custom marketing strategy designed for measurable growth.",
    icon: Target,
  },
  {
    id: "03",
    title: "Launch, Optimize & Scale",
    description:
      "Once approved, we execute, monitor performance, optimize campaigns, and continuously scale your business for long-term success.",
    icon: Rocket,
  },
];

export default function WorkProcess() {
  return (
    <section className="relative overflow-hidden bg-surface py-20 md:py-32">
      {/* Background Blur */}
      <div className="absolute left-0 top-10 h-48 w-48 rounded-full bg-electric-cyan/10 blur-[100px] md:top-20 md:h-72 md:w-72" />
      <div className="absolute right-0 bottom-10 h-48 w-48 rounded-full bg-purple/10 blur-[100px] md:bottom-10 md:h-72 md:w-72" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-24">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block rounded-full border border-electric-cyan/30 bg-electric-cyan/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-electric-cyan md:px-5 md:py-2 md:text-sm"
          >
            Our Process
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-extrabold text-white md:text-4xl lg:text-6xl"
          >
            Everything We Do Is
            <span className="bg-gradient-to-r from-electric-cyan to-purple bg-clip-text text-transparent">
              {" "}
              Quality Driven
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-base leading-relaxed text-gray-400 md:text-lg"
          >
            We follow a simple yet powerful process to help businesses
            generate more leads, increase conversions, and achieve sustainable
            growth.
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">

          {/* Desktop Line */}
          <div className="absolute left-0 right-0 top-24 hidden border-t-2 border-dashed border-electric-cyan/30 lg:block lg:top-32" />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">

            {process.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="group relative flex flex-col items-center"
                >
                  {/* Number */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-electric-cyan to-purple text-2xl font-bold text-white shadow-xl md:mb-10 md:h-20 md:w-20 md:text-3xl"
                  >
                    {item.id}
                  </motion.div>

                  {/* Card */}
                  <motion.div
                    whileHover={{ y: -8 }}
                    className="relative w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-500 hover:border-electric-cyan/50 hover:shadow-[0_0_40px_rgba(6,182,212,.25)] md:p-8 md:rounded-3xl"
                  >
                    {/* Icon */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-electric-cyan to-purple shadow-lg md:h-20 md:w-20 md:rounded-2xl">
                      <Icon size={28} className="text-white md:size={38}" />
                    </div>

                    <h3 className="mt-6 text-center text-lg font-bold text-white md:mt-8 md:text-2xl">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-center leading-relaxed text-gray-400 md:mt-5">
                      {item.description}
                    </p>

                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl bg-gradient-to-r from-electric-cyan via-royal-blue to-purple md:rounded-b-3xl" />
                  </motion.div>

                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
