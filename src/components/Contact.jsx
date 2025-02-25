import React, { useRef, useState } from 'react';
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
  const [responseMessage, setResponseMessage] = useState(null);

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
      const response = await fetch(
        'https://portfolio-email-services-g4v6xgxhd-kbs-projects-61b71ab2.vercel.app/api/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_name: form.name,
            from_email: form.email,
            message: form.message,
          }),
        }
      );
      if (response.ok) {
        setResponseMessage({
          type: 'success',
          text: 'Thank you. I will get back to you as soon as possible.',
        });
        setForm({ name: '', email: '', message: '' });
      } else {
        setResponseMessage({
          type: 'error',
          text: 'The service supporting this form is temporarily down. Please contact me via LinkedIn.',
        });
      }
    } catch (error) {
      console.error(error);
      setResponseMessage({
        type: 'error',
        text: 'The service supporting this form is temporarily down. Please contact me via LinkedIn.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setResponseMessage(null), 12000);
    }
  };

  return (
    <div className='xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden'>
      <motion.div
        variants={slideIn('left', 'tween', 0.2, 1)}
        className='flex-[0.75] bg-black-100 p-8 rounded-2xl'
      >
        <p className={styles.sectionSubText}>Get in touch</p>
        <h3 className={styles.sectionHeadText}>Contact.</h3>

        {responseMessage && (
          <div
            className={`relative mt-4 p-4 rounded-lg text-white text-center ${
              responseMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <button
              onClick={() => setResponseMessage(null)}
              className='absolute top-2 right-2 text-white text-lg font-bold'
            >
              ×
            </button>

            {responseMessage.type === 'error' ? (
              <>
                <p>The service supporting this form is temporarily down.</p>
                <p>Please contact me via LinkedIn:</p>
                <button
                  onClick={() =>
                    window.open(
                      'https://www.linkedin.com/in/kbernardmajor80/',
                      '_blank'
                    )
                  }
                  className='mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                >
                  Visit LinkedIn
                </button>
              </>
            ) : (
              responseMessage.text
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
