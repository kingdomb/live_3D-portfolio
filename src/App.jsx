import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import Routes & Route
import {
  About,
  Contact,
  Experience,
  Feedbacks,
  Hero,
  Navbar,
  Tech,
  Works,
  StarsCanvas,
  Admin,
  JDAnalyzer,
  ChatInterface,
} from './components';

const App = () => {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* 1. The Admin Panel Route (Must be separate) */}
        <Route path='/admin' element={<Admin />} />

        {/* 2. Your Existing Portfolio Route */}
        <Route
          path='/'
          element={
            <div className='relative z-0 bg-primary'>
              <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
                <Navbar />
                <Hero />
              </div>
              <About />
              <JDAnalyzer />
              <Experience />
              <Tech />
              <Works />
              <Feedbacks />
              <div className='relative z-0'>
                <Contact />
                <StarsCanvas />
              </div>
              <ChatInterface />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;