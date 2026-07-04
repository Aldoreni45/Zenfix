"use client";

import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  designation: string;
  company: string;
  review: string;
}

interface Props {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: Props) {
  return (
    <div className="w-full min-w-[340px] max-w-[440px] min-h-[320px] glass-card p-10 rounded-[32px] flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 border border-white/10">
      
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={18} className="fill-electric-cyan text-electric-cyan" />
            ))}
          </div>
          <Quote size={32} className="text-white/10 group-hover:text-electric-cyan/40 transition-colors duration-500" />
        </div>
        
        <p className="text-gray-400 leading-relaxed text-lg mb-10 line-clamp-4 font-medium">
          "{testimonial.review}"
        </p>
      </div>

      <div className="flex items-center gap-5 pt-8 border-t border-white/10 group-hover:border-electric-cyan/30 transition-colors duration-500">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">{testimonial.name}</h4>
          <p className="text-sm font-medium text-gray-400 mt-1">
            {testimonial.designation}, <span className="text-electric-cyan">{testimonial.company}</span>
          </p>
        </div>
      </div>
    </div>
  );
}