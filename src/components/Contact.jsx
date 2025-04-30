// src/components/Contact.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { styles } from '../styles';
import { EarthCanvas } from './canvas';
import { SectionWrapper } from '../hoc';
import { slideIn } from '../utils/motion';

const Contact = () => {
  const formRef = useRef();
  const widgetIdRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  // ← hard-coded production values:
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const apiUrl = import.meta.env.VITE_API_URL;

  // ─────── DEBUG: confirm values in the browser ───────
  // console.log('HARDCODED_SITE_KEY:', siteKey);
  // console.log('VITE_API_URL:', apiUrl);
  // console.log('import.meta.env.MODE:', import.meta.env.MODE);
  // console.log('import.meta.env:', import.meta.env);

  // ─── Load Enterprise script and render v2 checkbox ───
  useEffect(() => {
    if (!siteKey) {
      console.error('reCAPTCHA site key is missing.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.grecaptcha.enterprise.ready(() => {
        widgetIdRef.current = window.grecaptcha.enterprise.render(
          'recaptcha-container',
          {
            sitekey: siteKey,
            callback: (token) => {
              // console.log('Enterprise checkbox token:', token);
              setRecaptchaToken(token);
            },
          }
        );
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [siteKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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
    if (!recaptchaToken) {
      alert('Please complete the reCAPTCHA.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          'g-recaptcha-response': recaptchaToken,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        setResponseMessage({
          type: 'success',
          text: 'Thank you! I’ll be in touch soon.',
        });
        setForm({ name: '', email: '', message: '' });
        window.grecaptcha.enterprise.reset(widgetIdRef.current);
        setRecaptchaToken('');
      } else if (result.error === 'too_many_attempts') {
        setResponseMessage({
          type: 'error',
          text: 'Too many attempts—please try later.',
        });
      } else if (result.vagueError) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setResponseMessage({
        type: 'error',
        text: 'Something went wrong—please try again later.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setResponseMessage(null), 10000);
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
              responseMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <div className='relative p-4 rounded-lg mb-4'>
              {responseMessage.text}
              <button
                className='absolute top-1 right-1 text-white font-bold'
                onClick={() => setResponseMessage(null)}
              >
                X
              </button>
            </div>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='mt-12 flex flex-col gap-8'
        >
          {/* Name */}
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

          {/* Email */}
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

          {/* Message */}
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

          {/* Enterprise checkbox */}
          <div className='flex justify-center'>
            <div id='recaptcha-container'></div>
          </div>

          <button
            type='submit'
            className='bg-tertiary py-3 px-8 self-center rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary'
            disabled={loading}
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
