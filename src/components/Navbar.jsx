import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { navLinks } from '../constants';
import { logo, menu, close } from '../assets';
import { FaArrowUp } from 'react-icons/fa'; // <-- Add this line

// Layout convention: below `lg` = hamburger layout; `lg` and up = inline links layout.

// Each tagline segment carries its own leading pipe. The tagline box clips
// its left edge, so a segment that starts a line has its pipe hidden: the
// tagline can only break at the pipe, never mid-phrase, and never shows a
// dangling separator.
// Line count is fixed per breakpoint (one line, except two lines from `lg` to
// `xl` where the inline links leave the least room) so the logo height, which
// follows the text height, never feeds back into where the tagline wraps.
const TaglineSegments = ({ segments }) => (
  <span className='block overflow-hidden'>
    <span className='block -ml-4'>
      {segments.map((segment) => (
        <span key={segment} className='relative inline-block lg:block xl:inline-block pl-4'>
          <span className='absolute left-0 w-4 text-center'>|</span>
          {segment}
        </span>
      ))}
    </span>
  </span>
);

const Navbar = () => {
  const [active, setActive] = useState('');
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // const handleScroll = () => {
    //   const scrollTop = window.scrollY;

    //   // Set the scroll background color
    //   if (scrollTop > 100) {
    //     setScrolled(true);
    //   } else {
    //     setScrolled(false);
    //   }

    //   // If at the top of the page, set active to "About"
    //   if (scrollTop === 0) {
    //     setActive('About');
    //     return;
    //   }

    //   // Otherwise, check which section is in the viewport and update active link
    //   navLinks.forEach((nav) => {
    //     const section = document.getElementById(nav.id);
    //     const rect = section.getBoundingClientRect();

    //     if (rect.top <= 0 && rect.bottom >= 0) {
    //       setActive(nav.title);
    //     }
    //   });
    // };
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      // Set the scroll background color
      setScrolled(scrollTop > 100);

      // Remove early return
      navLinks.forEach((nav) => {
        const section = document.getElementById(nav.id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 0 && rect.bottom >= 0) {
            setActive(nav.title);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Initial check to set active on page load
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    document.documentElement.scrollIntoView({ behavior: 'smooth' });

    // Manually set active to 'About' after scroll-to-top
    setActive('About');
  };

  return (
    <nav
      className={`${
        styles.paddingX
      } w-full flex items-center py-5 fixed top-0 z-20 ${
        scrolled ? 'bg-primary' : 'bg-transparent'
      }`}
    >
      <div className='w-full flex justify-between items-center gap-4 max-w-7xl mx-auto'>
        <Link
          to='/'
          className='grid grid-cols-[auto_minmax(0,1fr)] gap-3 min-w-0'
          onClick={() => {
            setActive('');
            window.scrollTo(0, 0);
          }}
        >
          {/* Logo matches the text block's height and keeps the SVG's 5:4 ratio.
              Grid (not flex) so the row height comes from the text alone and the
              logo column width follows from that height via aspect-ratio. */}
          <span className='relative h-full aspect-[5/4]'>
            <img src={logo} alt='logo' className='absolute inset-0 w-full h-full object-contain' />
          </span>
          <span className='flex flex-col justify-center min-w-0 cursor-pointer'>
            <span className='text-white text-[18px] font-bold leading-tight'>Bernard</span>
            <span className='text-secondary leading-snug'>
              <span className='sm:hidden block text-[11px]'>Release Mgmt & AI</span>
              <span className='hidden sm:block text-[11px] lg:text-[12px] xl:text-[13px]'>
                <TaglineSegments
                  segments={['Delivery & Release Management', 'Enterprise AI Strategist & Architect']}
                />
              </span>
            </span>
          </span>
        </Link>

        {/* Regular Navbar Links */}
        <ul className='list-none hidden lg:flex flex-row gap-10 shrink-0'>
          {navLinks.map((nav) => (
            <li
              key={nav.id}
              className={`${
                active === nav.title ? 'text-white' : 'text-secondary'
              } hover:text-white text-[18px] font-medium cursor-pointer`}
              onClick={() => setActive(nav.title)}
            >
              <a href={`#${nav.id}`}>{nav.title}</a>
            </li>
          ))}
        </ul>

        {/* Menu Toggle Button for Small Screens */}
        <div className='lg:hidden flex shrink-0 justify-end items-center'>
          <img
            src={toggle ? close : menu}
            alt='menu'
            className='w-[28px] h-[28px] object-contain'
            onClick={() => setToggle(!toggle)}
          />

          {/* Dropdown menu (visible when toggle is true and on small screens) */}
          <div
            className={`${
              !toggle ? 'hidden' : 'flex'
            } p-6 glass-purple-gradient absolute top-full right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
          >
            <ul className='list-none flex justify-end items-start flex-1 flex-col gap-4'>
              {navLinks.map((nav) => (
                <li
                  key={nav.id}
                  className={`font-poppins font-medium cursor-pointer text-[16px] ${
                    active === nav.title ? 'text-white' : 'text-secondary'
                  }`}
                  onClick={() => {
                    setToggle(!toggle);
                    setActive(nav.title);
                  }}
                >
                  <a href={`#${nav.id}`}>{nav.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Scroll to Top Button */}
      <button
        className={`fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg transition-opacity duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={scrollToTop}
        aria-label='Scroll to Top'
      >
        <FaArrowUp size={20} />
      </button>
    </nav>
  );
};

export default Navbar;
