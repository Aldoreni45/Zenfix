"use client";

import styles from "./ServicesSection.module.css";

import {
  Ruler,
  House,
  Sofa,
  Trees,
  RefreshCcw,
  ClipboardList,
} from "lucide-react";

const services = [
  {
    icon: <Ruler size={36} strokeWidth={1.5} />,
    title: "Planning",
    text: "Our services are full fledged and we start at the very beginning. We plan every aspect of the design and execution well in advance.",
  },
  {
    icon: <House size={36} strokeWidth={1.5} />,
    title: "Architecture",
    text: "We can design to meet all your needs. Whether it is an Institution, Residence, Villa, Commercial space or Hospitality project.",
  },
  {
    icon: <Sofa size={36} strokeWidth={1.5} />,
    title: "Interiors",
    text: "We bring together the right elements in interior designing to make a house a stylish home for you and your loved ones.",
  },
  {
    icon: <Trees size={36} strokeWidth={1.5} />,
    title: "Landscapes",
    text: "We attend to detail at every step of the way to create beautiful spaces that complement your home or workplace.",
  },
  {
    icon: <RefreshCcw size={36} strokeWidth={1.5} />,
    title: "Sustainability",
    text: "Climate studies, Green building certification, MEPF services and renewable energy solutions.",
  },
  {
    icon: <ClipboardList size={36} strokeWidth={1.5} />,
    title: "Project Management",
    text: "We offer Project Management Consultancy services ensuring quality execution and timely completion.",
  },
];

export default function ServicesSection() {
  return (
    <section
      id="services"
      className={styles.servicesSection}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>

          <span className={styles.eyebrow}>What We Do</span>

          <h2>Our Services</h2>

          <div className={styles.line}></div>

          <p className={styles.intro}>
            Bezoh with its team of talented design professionals is
            committed to innovative ideas, methods and technologies
            with an attempt to create functional solutions.
          </p>

          <div className={styles.grid}>
            {services.map((service, index) => (
              <div
                key={index}
                className={styles.card}
              >
                <div className={styles.icon}>
                  {service.icon}
                </div>

                <h3>{service.title}</h3>

                <p>{service.text}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}