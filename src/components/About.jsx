import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { services } from "../constants";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const ServiceCard = ({ index, title, icon }) => (
  <Tilt className='xs:w-[250px] w-full'>
    <motion.div
      variants={fadeIn("right", "spring", index * 0.5, 0.75)}
      className='w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card'
    >
      <div
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col'
      >
        <img
          src={icon}
          alt='web-development'
          className='w-16 h-16 object-contain'
        />

        <h3 className='text-white text-[20px] font-bold text-center'>
          {title}
        </h3>
      </div>
    </motion.div>
  </Tilt>
);

const About = () => {
  return (
    <>
      <motion.div variants={textVariant()} className='max-w-3xl lg:mx-auto'>
        <p className={styles.sectionSubText}>Intro</p>
        <h2 className={styles.sectionHeadText}>Just Me.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn('', '', 0.1, 1)}
        className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px] lg:mx-auto'
      >
        I am a Master's-level Software Engineer and Enterprise AI Strategist, specializing in
        rebuilding organizational workflows around agentic AI and autonomous execution.
        <br /><br />
        My career is built at the intersection of complex systems engineering and highly
        regulated environments. Before architecting enterprise AI platforms, I managed
        mission-critical software releases in the freight industry and launched physical
        medical devices in the dental space. I know what it takes to ship products that cannot fail.
        <br /><br />
        Today, my focus is entirely on AI leadership and architecture. I build resilience-first,
        multi-agent systems that operate safely in production. I don't just implement AI as a
        novelty; I treat it as digital labor, engineering the oversight, security, and enterprise
        context required to solve real business bottlenecks and drive massive efficiency.
      </motion.p>
      <div className='mt-20 grid gap-10 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 place-items-center'>
        {services.map((service, index) => (
          <ServiceCard key={service.title} index={index} {...service} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(About, "about");
