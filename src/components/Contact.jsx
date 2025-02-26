import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { styles } from '../styles';
import { EarthCanvas } from './canvas';
import { SectionWrapper } from '../hoc';
import { slideIn } from '../utils/motion';

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [flash, setFlash] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {
      name: !form.name,
      email:
        !form.email ||
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email),
      message: !form.message,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).includes(true);
  };

  const triggerFlash = () => {
    let flashes = 0;
    const interval = setInterval(() => {
      setFlash((prev) => !prev);
      flashes++;
      if (flashes === 6) {
        clearInterval(interval);
        setFlash(false);
      }
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.ok) {
        setForm({ name: '', email: '', message: '' });
        setAttemptCount(0);
      } else if (
        result.error === 'too_many_attempts' ||
        result.silentBlock ||
        response.status === 403
      ) {
        setForm({ name: '', email: '', message: '' });
        triggerFlash();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden'>
      <motion.div
        variants={slideIn('left', 'tween', 0.2, 1)}
        className={`flex-[0.75] bg-black-100 p-8 rounded-2xl ${
          flash ? 'bg-red-500' : ''
        }`}
      >
        <p className={styles.sectionSubText}>Get in touch</p>
        <h3 className={styles.sectionHeadText}>Contact.</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='mt-12 flex flex-col gap-8'
        >
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Name</span>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              placeholder='What do you like to be called?'
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
            />
            {errors.name && (
              <span className='text-red-500 text-xs mt-1'>* Required</span>
            )}
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Email</span>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              placeholder='Which email do you check the most?'
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
            />
            {errors.email && (
              <span className='text-red-500 text-xs mt-1'>* Required</span>
            )}
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Message</span>
            <textarea
              rows={7}
              name='message'
              value={form.message}
              onChange={handleChange}
              placeholder='How can I help you or your team?'
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
            />
            {errors.message && (
              <span className='text-red-500 text-xs mt-1'>* Required</span>
            )}
          </label>
          <button
            type='submit'
            className='bg-tertiary py-3 px-8 self-center rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary'
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </motion.div>
      <motion.div
        variants={slideIn('right', 'tween', 0.2, 1)}
        className='xl:flex-1 xl:h-auto md:h-[550px] h-[350px]'
      >
        <EarthCanvas />
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Contact, 'contact');
