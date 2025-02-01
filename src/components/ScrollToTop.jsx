import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    document.documentElement.scrollIntoView({ behavior: 'smooth' });

    // Trigger active link update
    setTimeout(() => {
      // You may have some function to manually update active link here
      const aboutSection = document.getElementById('about');
      if (aboutSection && window.scrollY === 0) {
        // Manually set the active link to 'About'
        // Example: update your state or call the navbar's active link handler
      }
    }, 100); // Timeout to ensure the scroll has completed
  };

  return (
    <button
      className={`fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={scrollToTop}
      aria-label='Scroll to Top'
    >
      <FaArrowUp size={20} />
    </button>
  );
};

export default ScrollToTop;
