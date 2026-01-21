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
        I’m a Full-Stack AI Engineer & Release Manager with deep roots in
        JavaScript, Azure, and mobile development. Building high-performance AI
        solutions starts with selecting the right architecture—not just throwing
        an LLM at every problem. I approach every decision with careful
        consideration: Does this need a complex multi-agent system, or will a
        deterministic script be faster and cheaper? My focus is on building
        resilient systems, optimizing latency with RAG and vector databases, and
        ensuring safety through rigorous "Shadow Mode" testing. Whether acting
        as a Fractional AI Engineer or a Release Manager, I help organizations
        bridge the gap between "prototype" and "production" without breaking the
        budget. Let’s collaborate to turn your ideas into scalable, stable, and
        intelligent solutions.
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
