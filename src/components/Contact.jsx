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
  const [flash, setFlash] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!siteKey) {
      console.error('reCAPTCHA site key is missing.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => console.log('reCAPTCHA script loaded');
    document.body.appendChild(script);
  }, [siteKey]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const captchaResponse = document.querySelector(
        '.g-recaptcha-response'
      ).value;
      if (!captchaResponse) {
        alert('Please complete the reCAPTCHA.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          'g-recaptcha-response': captchaResponse,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponseMessage({
          type: 'success',
          text: 'Thank you. I will get back to you as soon as possible.',
        });

        setForm({ name: '', email: '', message: '' });

        // Reset reCAPTCHA
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }

        setTimeout(() => setResponseMessage(null), 10000);
      } else if (result.error === 'too_many_attempts') {
        setResponseMessage({
          type: 'error',
          text: 'You have exceeded the allowed submission attempts. Please try again later.',
        });
      } else if (result.vagueError) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setResponseMessage({
        type: 'error',
        text: 'Something went wrong. Please try again later.',
      });
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

        {responseMessage && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              responseMessage.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {responseMessage && (
              <div
                className={`relative p-4 rounded-lg mb-4 ${
                  responseMessage.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {responseMessage.text}
                <button
                  className='absolute top-1 right-1 text-white font-bold'
                  onClick={() => setResponseMessage(null)}
                >
                  X
                </button>
              </div>
            )}
          </div>
        )}

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

          <div className='flex justify-center'>
            <div
              className='g-recaptcha'
              data-sitekey={siteKey}
              data-action='submit'
            ></div>
          </div>

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
