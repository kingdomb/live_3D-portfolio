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
  csrfrontend,
} from '../assets';

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
    title: "AI Engineer",
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
    title: "Entrepreneur & Consultant",
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
    title: 'Freelance Full-Stack Engineer / AI Architect',
    company_name: 'Major Media Group LLC',
    icon: freelance, // Ensure you have this import
    iconBg: '#ff7200', // You might want to update this color if needed
    date: 'Jan 2020 - Present',
    points: [
      'Architected a resilience-first multi-agent system using Docker, Node.js, and Redis, implementing an asynchronous event-driven architecture.',
      "Engineered a 'Shadow Mode' sandbox environment, allowing new AI models (Llama 3, Gemini 2.0) to run in parallel with live traffic for safe A/B testing.",
      'Built Secure Retrieval-Augmented Generation (RAG) memory systems using PostgreSQL and pgvector, enforcing strict multi-tenant data isolation.',
      'Developed a custom Chaos Engine middleware to inject artificial latency and faults, validating system resilience and backpressure management.',
      'Delivered scalable full-stack web solutions, translating business needs into secure payment integrations and custom CMS platforms.',
      'Led end-to-end delivery—from design and branding to hosting, domain setup, and digital marketing execution.',
    ],
  },
  {
    title: 'React Native Engineer / Software Release Manager',
    company_name: 'Saia LTL Freight',
    icon: saia, // Ensure you have this import
    iconBg: '#ffffff',
    date: 'Nov 2020 - Mar 2023',
    points: [
      'Directed end-to-end Release Management, ensuring risk mitigation, milestone delivery, and cross-functional coordination across enterprise systems.',
      'Co-developed a React Native mobile app with Okta SSO for 5,000+ enterprise users, strengthening authentication and platform security.',
      'Managed the full software lifecycle for Zebra (Android) handheld freight scanners, including feature development, debugging, and global deployment.',
      'Engineered integrations for Samsara and CoPilot GPS systems, streamlining fleet tracking capabilities.',
      'Enhanced Billing, Claims APIs, and Eligibility services, improving accuracy, interoperability, and performance.',
      'Led Agile ceremonies, capacity planning, and backlog refinement, improving transparency and team throughput.',
      'Collaborated with Security and Infrastructure stakeholders to align technical deliverables with regulatory requirements (DOT/FMCSA).',
      'Oversaw QA, UAT, and pre-release validation, reducing post-release defects and improving production stability.',
    ],
  },
  {
    title: 'Product Manager / Sr. Dental Lab Tech',
    company_name: '3Sixty Dental (formerly 360 Imaging)',
    icon: threesixty, // Ensure you have this import
    iconBg: '#ff0000',
    date: 'Jan 2016 - Nov 2019',
    points: [
      'Led a cross-functional team to launch Anatomical Guide™, delivering proprietary implant-planning software and CAD/CAM workflows in a HIPAA-regulated environment.',
      'Streamlined dental lab processes, reducing turnaround times by 20% through optimized workflows and resource allocation.',
      'Developed a vendor on-boarding tool, cutting annual costs by 25% and improving communication across teams.',
      'Improved quality control for patient-specific implants, reducing clinical errors by 30%.',
      'Reduced material waste by 30% in CAD/CAM milling, improving prosthetic precision.',
      'Ensured regulatory compliance, including MSDS documentation, for patient-specific medical devices.',
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
    name: 'Carwash CSR Portal Front-End [RESPONSIVE]',
    description:
      'This is a fully-functional, Customer Service Rep. Portal front-end(only) site. It allows CSRs to efficiently manage user accounts, view subscription details, and handle support interactions. The design emphasizes clarity and speed, with sortable tables, real-time form validation, and smooth UI transitions. Developed to integrate seamlessly with a RESTful microservice backend, the portal showcases strong focus on usability, component reusability, and frontend performance.',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'vite',
        color: 'blue-text-gradient',
      },
      {
        name: 'js',
        color: 'green-text-gradient',
      },
      {
        name: 'tailwindcss',
        color: 'pink-text-gradient',
      },
    ],
    image: csrfrontend,
    source_code_link: 'https://github.com/kingdomb/csr-portal-frontend/',
    demo_link: 'https://csr-frontend.vercel.app/',
  },
  {
    name: 'eCommerce Front-End [RESPONSIVE]',
    description:
      'This is a semi-functional, eCommerce front-end(only) site. There is a good chance this will all get placed into React components, and I would also improve the design. The thought was giving this partial app some exposure, might be a good idea.',
    tags: [
      {
        name: 'html',
        color: 'blue-text-gradient',
      },
      {
        name: 'js',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
      {
        name: 'cssanimations',
        color: 'pink-text-gradient',
      },
    ],
    image: commerce1,
    source_code_link: 'https://github.com/KingdomB/firestore-2020-ecommerce',
    demo_link: 'https://kingdomb.github.io/firestore-2020-ecommerce/',
  },
  {
    name: 'NLP Course Recommender [VIDEO DEMO]',
    description:
      'My app is a phase 2 poc for creating a natural language processor that recommends career-related classes to college students. It does this by analyzing their current course grades to identify learning gaps and strengths. Based on this analysis, the app generates recommended courses using similarity scores derived from various vectorized data points. [NOTE: The demo is in video format to protect the proprietary nature of the proposal.]',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'redux',
        color: 'blue-text-gradient',
      },
      {
        name: 'js',
        color: 'green-text-gradient',
      },
      {
        name: 'nodejs',
        color: 'brown-text-gradient',
      },
      {
        name: 'tailwindcss',
        color: 'pink-text-gradient',
      },
      {
        name: 'firebase',
        color: 'red-text-gradient',
      },
      {
        name: 'nlp',
        color: 'yellow-text-gradient',
      },
      {
        name: 'figma',
        color: 'orange-text-gradient',
      },
    ],
    image: nlpcourses,
    source_code_link: 'https://github.com/kingdomb/ed-nlp-test_rebuild',
    demo_link:
      'https://kingdomb.github.io/live_portfolio-v2/assets/files/nlp-demo-video.mp4',
  },
  {
    name: 'Home Remodeling Website [RESPONSIVE]',
    description:
      "I built, deployed, and managed Edward Jr. Construction LLC's site under contract through my own media company, MMG LLC.",
    tags: [
      {
        name: 'html',
        color: 'blue-text-gradient',
      },
      {
        name: 'jquery',
        color: 'green-text-gradient',
      },
      {
        name: 'php',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
      {
        name: 'bootstrap',
        color: 'pink-text-gradient',
      },
      {
        name: 'mailchimp',
        color: 'orange-text-gradient',
      },
    ],
    image: edjrconstruction,
    source_code_link: 'https://github.com/kingdomb/eduardjrconstruction',
    demo_link: 'https://kingdomb.github.io/eduardjrconstruction/',
  },
  {
    name: 'Lambo Details View [NON-RESPONSIVE]',
    description:
      'A non-functional, non-responsive, more details page that I created(from a mockup) to tryout an animation idea that displays a car image rolling into view.',
    tags: [
      {
        name: 'html',
        color: 'blue-text-gradient',
      },
      {
        name: 'js',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
      {
        name: 'cssanimations',
        color: 'pink-text-gradient',
      },
    ],
    image: lambo,
    source_code_link: 'https://github.com/KingdomB/lambo-animation',
    demo_link: 'https://kingdomb.github.io/lambo-animation/',
  },
  {
    name: 'Angular GPA Calculator [RESPONSIVE]',
    description:
      'My first Angular project, completed for school using the Angular 9 framework. The application stores class grades and calculates GPAs. It’s showcased here to demonstrate my ability to work with unfamiliar technologies. [Use Student IDs (1007, 1008, 1009, 1010, 1011, or 1012) to login.]',
    tags: [
      {
        name: 'angular',
        color: 'blue-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
      {
        name: 'material',
        color: 'pink-text-gradient',
      },
    ],
    image: angularcalc,
    source_code_link: 'https://github.com/kingdomb/angular_grade_gpa.calc./',
    demo_link: 'https://kingdomb.github.io/angular_grade_gpa.calc./',
  },
  {
    name: 'Gym Landing Site [NON-RESPONSIVE]',
    description:
      "I had fun building this non-functional landing page, and it's my favorite so far. I'm not particularly impressed by my icons, but that was the designer's choice. Enjoy!",
    tags: [
      {
        name: 'html',
        color: 'blue-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
      {
        name: 'bootstrap',
        color: 'pink-text-gradient',
      },
    ],
    image: gym1,
    source_code_link: 'https://github.com/KingdomB/gym-landing',
    demo_link: 'https://kingdomb.github.io/gym-landing/',
  },
];

export { services, technologies, experiences, testimonials, projects };
