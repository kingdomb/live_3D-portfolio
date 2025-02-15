import {
  mobile,
  backend,
  cloud,
  web,
  javascript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  mongodb,
  git,
  reactnative,
  docker,
  saia,
  threesixty,
  freelance,
  commerce1,
  nlpcourses,
  edjrconstruction,
  expogo,
  azure,
  angularcalc,
  lambo,
  gym1,
  ron,
  derrick,
  eduard,
} from "../assets";

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Experience",
  },
  {
    id: "projects",
    title: "Projects",
  },
  {
    id: "testimonial",
    title: "Testimonials",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "Web Developer",
    icon: web,
  },
  {
    title: "React Native Developer",
    icon: mobile,
  },
  {
    title: "Node.js Backend Developer",
    icon: backend,
  },
  {
    title: "Aspiring Cloud Engineer",
    icon: cloud,
  },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },
  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "Redux Toolkit",
    icon: redux,
  },
  {
    name: "Tailwind CSS",
    icon: tailwind,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "MongoDB",
    icon: mongodb,
  },
  {
    name: "Three JS",
    icon: expogo,
  },
  {
    name: "git",
    icon: git,
  },
  {
    name: "reactnative",
    icon: reactnative,
  },
  {
    name: "docker",
    icon: docker,
  },
  {
    name: "azure",
    icon: azure,
  },
];

const experiences = [
  {
    title: "React Native Developer",
    company_name: "Saia LTL Freight",
    icon: saia,
    iconBg: "#ffffff",
    date: "Nov 2020 - Mar 2023",
    points: [
      "Developed mobile app code changes for 5,000 drivers, significantly improving functionality and user satisfaction.",
      "Co-developed Okta SSO mobile app with React Native, enhancing security and reducing login times.",
      "Led story grooming, backlog prioritization, and sprint planning with Agile teams, streamlining project delivery.",
      "Participating in code reviews and providing constructive feedback to other developers.",
      "Directed QA, UAT, and pre-release testing, minimizing post-launch defects and ensuring high-quality releases.",
      "Coded business reqs into REST/SOAP APIs, optimizing data exchange and system integration for enhanced performance.",
      "Designed and led the migration of on-prem SOAP to a REST API system infrastructure on Azure PaaS.",
      "Built and migrated the linkex.us site to Azure PaaS using Angular, ensuring a seamless user experience.",
    ],
  },
  {
    title: "Dental Lab Technician/ & Product Manager",
    company_name: "360 Imaging LLC",
    icon: threesixty,
    iconBg: "#ff0000",
    date: "Jan 2016 - Nov 2019",
    points: [
      "Streamlined dental lab processes, reducing turnaround times by 20% through optimized workflows and resource allocation.",
      "Led a cross-functional team to launch Anatomical GuideTM, cutting production costs by 15% using CAD/CAM technologies.",
      "Improved quality control for patient-specific implants, reducing errors by 30% and increasing patient satisfaction.",
      "Developed a vendor on-boarding tool, cutting annual costs by 25% and improving communication across teams.",
      "Enhanced lab efficiency by 25% through workflow optimization, maintaining high quality in prosthetic fabrication.",
      "Contributed to the development of innovative dental products, ensuring regulatory compliance and industry recognition.",
    ],
  },
  {
    title: "Freelance Web Developer",
    company_name: "My Company",
    icon: freelance,
    iconBg: "#ff7200",
    date: "Jan 2020 - CURRENT",
    points: [
      "Built scalable websites using front-end and back-end technologies, integrating payment systems for seamless transactions.",
      "Led design and deployment efforts, including logo creation, domain setup, and digital marketing strategies.",
      "Collaborated with clients to align web solutions with business goals, enhancing overall project success.",
      "Managed multiple projects simultaneously, consistently meeting deadlines and exceeding client expectations.",
      "Troubleshot and resolved WordPress rendering and styling errors, improving site performance for Limit Imagine LLC.",
      "Redesigned Eastminster Presbyterian Church website, enhancing its user experience and visual appeal.",
    ],
  },
];

const testimonials = [
  {
    testimonial:
      "Bernard and I made a great team! He pays strict attention to detail, has amazing adaptability, and has a genuine thirst for knowledge. He will be a great asset to any team",
    name: "R. Wabukenda",
    designation: "Full Stack Engineer",
    company: "Salesloft",
    image: ron,
  },
  {
    testimonial:
      "I only have good things to say about Bernard. He is honest, hardworking, reliable, and always executed nothing short of amazing work.",
    name: "D. Alston",
    designation: "Tier 2 IT Support Specialist",
    company: "Piedmont Urgent Care by WellStreet",
    image: derrick,
  },
  {
    testimonial:
      "Bernard's company built my website. I know he is doing this all by himself, and the work and effort are amazing.",
    name: "E. Perju",
    designation: "Owner",
    company: "Edward's Jr. Construction LLC",
    image: eduard,
  },
];

const projects = [
  {
    name: "eCommerce Front-End [RESPONSIVE]",
    description:
      "This is a semi-functional, eCommerce front-end(only) site. There is a good chance this will all get placed into React components, and I would also improve the design. The thought was giving this partial app some exposure, might be a good idea.",
    tags: [
      {
        name: "html",
        color: "blue-text-gradient",
      },
      {
        name: "js",
        color: "green-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
      {
        name: "cssanimations",
        color: "pink-text-gradient",
      },
    ],
    image: commerce1,
    source_code_link: "https://github.com/KingdomB/firestore-2020-ecommerce",
    demo_link: "https://kingdomb.github.io/firestore-2020-ecommerce/",
  },
  {
    name: "NLP Course Recommender [VIDEO DEMO]",
    description:
      "My app is a phase 2 poc for creating a natural language processor that recommends career-related classes to college students. It does this by analyzing their current course grades to identify learning gaps and strengths. Based on this analysis, the app generates recommended courses using similarity scores derived from various vectorized data points. [NOTE: The demo is in video format to protect the proprietary nature of the proposal.]",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "redux",
        color: "blue-text-gradient",
      },
      {
        name: "js",
        color: "green-text-gradient",
      },
      {
        name: "nodejs",
        color: "brown-text-gradient",
      },
      {
        name: "tailwindcss",
        color: "pink-text-gradient",
      },
      {
        name: "firebase",
        color: "red-text-gradient",
      },
      {
        name: "nlp",
        color: "yellow-text-gradient",
      },
      {
        name: "figma",
        color: "orange-text-gradient",
      },
    ],
    image: nlpcourses,
    source_code_link: "https://github.com/kingdomb/ed-nlp-test_rebuild",
    demo_link: "https://kingdomb.github.io/live_portfolio-v2/assets/files/nlp-demo-video.mp4",
  },
  {
    name: "Home Remodeling Website [RESPONSIVE]",
    description:
      "I built, deployed, and managed Edward Jr. Construction LLC's site under contract through my own media company, MMG LLC.",
    tags: [
     {
        name: "html",
        color: "blue-text-gradient",
      },
      {
        name: "jquery",
        color: "green-text-gradient",
      },
      {
        name: "php",
        color: "green-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
      {
        name: "bootstrap",
        color: "pink-text-gradient",
      },
      {
        name: "mailchimp",
        color: "orange-text-gradient",
      },
    ],
    image: edjrconstruction,
    source_code_link: "https://github.com/kingdomb/eduardjrconstruction",
    demo_link: "https://kingdomb.github.io/eduardjrconstruction/",
  },
  {
    name: "Lambo Details View [NON-RESPONSIVE]",
    description:
      "A non-functional, non-responsive, more details page that I created(from a mockup) to tryout an animation idea that displays a car image rolling into view.",
    tags: [
      {
        name: "html",
        color: "blue-text-gradient",
      },
      {
        name: "js",
        color: "green-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
      {
        name: "cssanimations",
        color: "pink-text-gradient",
      },
    ],
    image: lambo,
    source_code_link: "https://github.com/KingdomB/lambo-animation",
    demo_link: "https://kingdomb.github.io/lambo-animation/",
  },
  {
    name: "Angular GPA Calculator [RESPONSIVE]",
    description:
      "My first Angular project, completed for school using the Angular 9 framework. The application stores class grades and calculates GPAs. It’s showcased here to demonstrate my ability to work with unfamiliar technologies. [Use Student IDs (1007, 1008, 1009, 1010, 1011, or 1012) to login.]",
    tags: [
      {
        name: "angular",
        color: "blue-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
      {
        name: "material",
        color: "pink-text-gradient",
      },
    ],
    image: angularcalc,
    source_code_link: "https://github.com/kingdomb/angular_grade_gpa.calc./",
    demo_link: "https://kingdomb.github.io/angular_grade_gpa.calc./",
  },
  {
    name: "Gym Landing Site [NON-RESPONSIVE]",
    description:
      "I had fun building this non-functional landing page, and it's my favorite so far. I'm not particularly impressed by my icons, but that was the designer's choice. Enjoy!",
    tags: [
      {
        name: "html",
        color: "blue-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
      {
        name: "bootstrap",
        color: "pink-text-gradient",
      },
    ],
    image: gym1,
    source_code_link: "https://github.com/KingdomB/gym-landing",
    demo_link: "https://kingdomb.github.io/gym-landing/",
  },
];

export { services, technologies, experiences, testimonials, projects };
