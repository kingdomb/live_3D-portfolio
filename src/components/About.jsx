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
        I’m a skilled software developer with experience in JavaScript, Azure,
        WordPress, and frameworks like React, React Native, Node.js, and
        Three.js. Delivering high-performance mobile & web solutions starts with
        selecting the right tools for each project—not just following trends.
        Every decision is approached with careful consideration, whether
        evaluating if a frontend framework is necessary or if a streamlined
        static site would be more effective and cost-efficient. I focus on
        optimizing page speed using SSR, CSR, ISR, or SSG while minimizing
        deployment challenges by avoiding unnecessary dependencies. My
        adaptability and problem-solving skills help organizations achieve an
        optimal balance of performance, maintainability, and budget. Let’s
        collaborate to turn your ideas into scalable, efficient, and
        user-friendly solutions!
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
