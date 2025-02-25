import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { navLinks } from '../constants';
import { logo, menu, close } from '../assets';
import { FaArrowUp } from 'react-icons/fa'; // <-- Add this line

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
      <div className='w-full flex justify-between items-center max-w-7xl mx-auto'>
        <Link
          to='/'
          className='flex items-center gap-2'
          onClick={() => {
            setActive('');
            window.scrollTo(0, 0);
          }}
        >
          <img src={logo} alt='logo' className='w-9 h-9 pb-2 object-contain' />
          <p className='text-white text-[18px] font-bold cursor-pointer flex '>
            Bernard &nbsp;
            <span className='xl:block hidden'>
              {' '}
              | Web & Mobile Developer Portfolio
            </span>
          </p>
        </Link>

        {/* Regular Navbar Links */}
        <ul className='list-none hidden lg:flex flex-row gap-10'>
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
        <div className='lg:hidden flex flex-1 justify-end items-center'>
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
            } p-6 glass-purple-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
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
