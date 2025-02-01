import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn, textVariant } from "../utils/motion";

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
  demo_link,
}) => {
  // Extract name and bracketed text
  const nameMatch = name.match(/(.*?)\s*\[(.*?)\]/);
  const displayName = nameMatch ? nameMatch[1] : name;
  const nameBracketedText = nameMatch ? nameMatch[2] : null;

  // Extract bracketed text from description
  const descriptionMatch = description.match(/(.*?)\s*\[(.*?)\]/);
  const displayDescription = descriptionMatch
    ? descriptionMatch[1]
    : description;
  const descriptionBracketedText = descriptionMatch
    ? descriptionMatch[2]
    : null;

  return (
    <motion.div variants={fadeIn('up', 'spring', index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary p-5 rounded-2xl w-full flex flex-col h-full'
      >
        <div className='relative w-full h-[230px]'>
          <img
            onClick={() => window.open(demo_link, '_blank')}
            src={image}
            alt='project_image'
            className='w-full h-full object-cover rounded-2xl'
          />

          <div className='absolute top-3 right-3'>
            <div
              onClick={(e) => {
                e.stopPropagation();
                window.open(source_code_link, '_blank');
              }}
              className='black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer'
            >
              <img
                src={github}
                alt='source code'
                className='w-1/2 h-1/2 object-contain'
              />
            </div>
          </div>
        </div>

        <div className='flex flex-col flex-grow mt-5'>
          <h3 className='text-white font-bold text-[24px]'>
            {displayName}{' '}
            {nameBracketedText && (
              <span className='text-[16px] font-bold block lime-text-gradient'>
                [{nameBracketedText}]
              </span>
            )}
          </h3>
          <p className='mt-2 text-secondary text-[14px] flex-grow'>
            {displayDescription}{' '}
            {descriptionBracketedText && (
              <span className='text-[14px] font-bold block gold-text-gradient'>
                [{descriptionBracketedText}]
              </span>
            )}
          </p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <p
              key={`${name}-${tag.name}`}
              className={`text-[14px] ${tag.color}`}
            >
              #{tag.name}
            </p>
          ))}
        </div>
      </Tilt>
    </motion.div>
  );
};

const Works = () => {
  return (
    <>
      <motion.div variants={textVariant()} className='max-w-3xl lg:mx-auto'>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
      </motion.div>

      <div className='w-full flex'>
        <motion.p
          variants={fadeIn('', '', 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px] lg:mx-auto'
        >
          The following projects highlight my skills and experience through
          real-world examples. Each project is briefly outlined with links to
          the GitHub repositories and the web app [click the image]. They
          demonstrate my ability to solve complex problems, work with various
          technologies, and manage projects efficiently.
        </motion.p>
      </div>

      <div className='mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-center items-stretch'>
        {projects.map((project, index) => (
          <ProjectCard key={`project-${index}`} index={index} {...project} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(Works, "projects");
