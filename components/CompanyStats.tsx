"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Mail, Phone, MapPin, Award, Users, Briefcase, Calendar } from "lucide-react";

function AnimatedCounter({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function CompanyStats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-surface to-background py-20 md:py-32">
      {/* Background Blur */}
      <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-electric-cyan/10 blur-[100px] md:left-20 md:top-20 md:h-72 md:w-72" />
      <div className="absolute right-10 bottom-10 h-48 w-48 rounded-full bg-purple/10 blur-[100px] md:right-20 md:bottom-20 md:h-72 md:w-72" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex rounded-full border border-electric-cyan/30 bg-electric-cyan/10 px-4 py-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-electric-cyan"
          >
            About Us
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl"
          >
            Our Journey &
            <span className="bg-gradient-to-r from-electric-cyan to-purple bg-clip-text text-transparent">
              {" "}
              Achievements
            </span>
          </motion.h2>
        </motion.div>

        {/* Company Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:mb-16 md:p-8"
        >
          <h3 className="mb-4 text-xl font-bold text-white md:text-2xl">Company Description</h3>
          <p className="text-base leading-relaxed text-gray-400 md:text-lg">
            Since our journey began in 2020, we have completed 256+ projects and collaborated with over 128 clients, earning 16 awards along the way. These milestones represent our commitment to quality, creativity, and building strong client relationships through consistent performance.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mb-12 grid grid-cols-2 gap-4 md:mb-16 md:grid-cols-4 md:gap-6"
        >
          {/* Founded */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl border border-electric-cyan/20 bg-gradient-to-br from-electric-cyan/10 to-transparent p-6 backdrop-blur-lg transition-all duration-300"
          >
            <Calendar className="mb-4 h-8 w-8 text-electric-cyan md:h-10 md:w-10" />
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl"><AnimatedCounter end={2020} duration={2} /></div>
            <div className="text-sm font-semibold text-gray-400 md:text-base">Founded</div>
          </motion.div>

          {/* Projects */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl border border-purple/20 bg-gradient-to-br from-purple/10 to-transparent p-6 backdrop-blur-lg transition-all duration-300"
          >
            <Briefcase className="mb-4 h-8 w-8 text-purple md:h-10 md:w-10" />
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl"><AnimatedCounter end={256} duration={2} suffix="+" /></div>
            <div className="text-sm font-semibold text-gray-400 md:text-base">Projects</div>
          </motion.div>

          {/* Clients */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl border border-electric-cyan/20 bg-gradient-to-br from-electric-cyan/10 to-transparent p-6 backdrop-blur-lg transition-all duration-300"
          >
            <Users className="mb-4 h-8 w-8 text-electric-cyan md:h-10 md:w-10" />
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl"><AnimatedCounter end={128} duration={2} suffix="+" /></div>
            <div className="text-sm font-semibold text-gray-400 md:text-base">Clients</div>
          </motion.div>

          {/* Awards */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl border border-purple/20 bg-gradient-to-br from-purple/10 to-transparent p-6 backdrop-blur-lg transition-all duration-300"
          >
            <Award className="mb-4 h-8 w-8 text-purple md:h-10 md:w-10" />
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl"><AnimatedCounter end={16} duration={2} /></div>
            <div className="text-sm font-semibold text-gray-400 md:text-base">Awards</div>
          </motion.div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:p-8"
        >
          <h3 className="mb-6 text-xl font-bold text-white md:text-2xl">Contact Information</h3>
          
          <div className="space-y-4 md:space-y-6">
            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-center gap-4 rounded-xl bg-white/5 p-4 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-cyan/20">
                <Mail className="h-5 w-5 text-electric-cyan md:h-6 md:w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-400 md:text-base">Email</div>
                <div className="text-base font-semibold text-white md:text-lg">zenfixin@gmail.com</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-center gap-4 rounded-xl bg-white/5 p-4 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-cyan/20">
                <Phone className="h-5 w-5 text-electric-cyan md:h-6 md:w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-400 md:text-base">Phone</div>
                <div className="text-base font-semibold text-white md:text-lg">+91 83009 80023</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-center gap-4 rounded-xl bg-white/5 p-4 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-cyan/20">
                <MapPin className="h-5 w-5 text-electric-cyan md:h-6 md:w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-400 md:text-base">Location</div>
                <div className="text-base font-semibold text-white md:text-lg">Chentharai, Tamil Nadu 629193</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
