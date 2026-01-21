import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function JDAnalyzer() {
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!jd.trim()) return;    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-jd', {
        body: { jobDescription: jd },
      });

      if (error) throw error;
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJd('');
    setAnalysis(null);
    setError('');
  };

  return (
    <div className='w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-800 my-12 shadow-2xl'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-2'>
          Honest Fit Assessment 🎯
        </h2>
        <p className='text-gray-400'>
          Paste a job description below. My AI will honestly tell you if I'm a
          good fit, including why you{' '}
          <span className='text-amber-500 font-bold'>shouldn't</span> hire me.
        </p>
      </div>

      {/* Input Section */}
      <div className='mb-6'>
        <textarea
          className='w-full h-48 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all resize-none'
          placeholder='Paste Job Description here...'
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />

        {/* Buttons Row */}
        <div className='mt-4 flex justify-end gap-4'>
          {/* CLEAR BUTTON - Now sits next to Analyze */}
          {jd && (
            <button
              onClick={handleClear}
              className='text-gray-400 hover:text-white px-6 py-3 rounded-lg hover:bg-red-500/20 transition-all font-semibold border border-transparent hover:border-red-500/50'
            >
              Clear
            </button>
          )}

          {/* ANALYZE BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !jd.trim()}
            className='bg-teal-500 text-black font-bold py-3 px-8 rounded-lg hover:bg-teal-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-teal-500/20'
          >
            {loading ? (
              <>
                <span className='animate-spin'>🔄</span> Analyzing...
              </>
            ) : (
              'Analyze Fit'
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-center mb-6'>
          {error}
        </div>
      )}

      {/* Results Section */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-gray-950 border border-gray-800 rounded-xl p-6 md:p-8'
        >
          {/* Header Badge */}
          <div className='flex justify-center mb-6'>
            <span
              className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
                analysis.verdict === 'strong_fit'
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : analysis.verdict === 'probably_not'
                    ? 'bg-amber-900 text-amber-300 border border-amber-700'
                    : 'bg-gray-800 text-gray-300 border border-gray-600'
              }`}
            >
              {analysis.verdict.replace('_', ' ')}
            </span>
          </div>

          <h3 className='text-2xl font-bold text-white text-center mb-4'>
            {analysis.headline}
          </h3>
          <p className='text-gray-300 text-center italic mb-8 border-b border-gray-800 pb-6'>
            "{analysis.opening}"
          </p>

          <div className='grid md:grid-cols-2 gap-8'>
            {/* The Gaps (The Honest Part) */}
            <div>
              <h4 className='text-amber-500 font-bold mb-4 flex items-center gap-2'>
                <span>⚠️</span> Where I Don't Fit
              </h4>
              {analysis.gaps?.length > 0 ? (
                <div className='space-y-4'>
                  {analysis.gaps.map((gap, i) => (
                    <div
                      key={i}
                      className='bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg'
                    >
                      <div className='text-sm text-amber-400 font-semibold mb-1'>
                        {gap.gap_title}
                      </div>
                      <div className='text-gray-400 text-sm'>
                        {gap.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-sm'>
                  No major gaps detected for this specific role.
                </p>
              )}
            </div>

            {/* The Match */}
            <div>
              <h4 className='text-teal-500 font-bold mb-4 flex items-center gap-2'>
                <span>✅</span> What Transfers
              </h4>
              <div className='bg-teal-950/20 border border-teal-900/30 p-4 rounded-lg text-gray-300 text-sm leading-relaxed'>
                <ReactMarkdown>{analysis.transfers}</ReactMarkdown>
              </div>

              <h4 className='text-white font-bold mt-6 mb-2'>
                My Recommendation
              </h4>
              <p className='text-gray-300 text-sm'>{analysis.recommendation}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
