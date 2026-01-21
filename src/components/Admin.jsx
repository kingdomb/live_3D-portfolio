import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- DATA STATE ---
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    elevator_pitch: '',
    looking_for: '',
    not_looking_for: '',
    salary_min: '',
    remote_preference: '',
  });
  const [experiences, setExperiences] = useState([]);
  // These were missing in your previous code:
  const [skills, setSkills] = useState([]);
  const [gaps, setGaps] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData() {
    // 1. Load Profile
    const { data: profileData } = await supabase
      .from('candidate_profile')
      .select('*')
      .maybeSingle();
    if (profileData) setProfile(profileData);

    // 2. Load Experiences
    const { data: expData } = await supabase
      .from('experiences')
      .select('*')
      .order('display_order');
    if (expData) setExperiences(expData);

    // 3. Load Skills (Fixes "skills is not defined")
    const { data: skillData } = await supabase
      .from('skills')
      .select('*')
      .order('category');
    if (skillData) setSkills(skillData);

    // 4. Load Gaps
    const { data: gapData } = await supabase
      .from('gaps_weaknesses')
      .select('*');
    if (gapData) setGaps(gapData);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  // --- PROFILE HANDLERS ---
  const handleUpdateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from('candidate_profile').upsert(profile);
    if (error) alert('Error saving profile: ' + error.message);
    else alert('Profile saved!');
  };

  // --- EXPERIENCE HANDLERS ---
  const handleAddExperience = async () => {
    const { error } = await supabase.from('experiences').insert([
      {
        company_name: 'New Company',
        title: 'Job Title',
        candidate_id: profile.id,
      },
    ]);
    if (!error) fetchData();
    else alert('Error adding row: ' + error.message);
  };

  const handleUpdateExperience = (id, field, value) => {
    setExperiences((prevExperiences) =>
      prevExperiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    );
  };

  const handleSaveExperiences = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('experiences').upsert(experiences);
      if (error) throw error;
      alert('All experiences saved!');
    } catch (error) {
      alert('Error saving experiences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    const { error } = await supabase.from('experiences').delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    }
  };

  // --- SKILLS HANDLERS ---
  const handleAddSkill = async () => {
    const { error } = await supabase.from('skills').insert([
      {
        candidate_id: profile.id,
        skill_name: 'New Skill',
        category: 'strong',
        honest_notes: 'I use this daily.',
      },
    ]);
    if (!error) fetchData();
  };

  const handleUpdateSkill = (id, field, value) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleSaveSkills = async () => {
    const { error } = await supabase.from('skills').upsert(skills);
    if (error) alert('Error: ' + error.message);
    else alert('Skills saved!');
  };

  // --- GAPS HANDLERS ---
  const handleAddGap = async () => {
    const { error } = await supabase.from('gaps_weaknesses').insert([
      {
        candidate_id: profile.id,
        description: 'New Gap',
        why_its_a_gap: 'I have never used this technology.',
      },
    ]);
    if (!error) fetchData();
  };

  const handleUpdateGap = (id, field, value) => {
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    );
  };

  const handleSaveGaps = async () => {
    const { error } = await supabase.from('gaps_weaknesses').upsert(gaps);
    if (error) alert('Error: ' + error.message);
    else alert('Gaps saved!');
  };

  // --- VIEW: LOGIN SCREEN ---
  if (!session) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-900 text-white'>
        <form
          onSubmit={handleLogin}
          className='w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg'
        >
          <h2 className='text-2xl mb-6 font-bold text-teal-400'>
            Portfolio Admin
          </h2>
          <input
            className='w-full p-3 mb-4 bg-gray-700 rounded border border-gray-600'
            type='email'
            placeholder='Your Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className='w-full p-3 mb-6 bg-gray-700 rounded border border-gray-600'
            type='password'
            placeholder='Your Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={loading}
            className='w-full bg-teal-500 hover:bg-teal-600 text-black font-bold p-3 rounded'
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    );
  }

  // --- VIEW: DATA ENTRY SCREEN ---
  return (
    <div className='min-h-screen bg-gray-900 text-gray-100 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-teal-400'>Control Panel</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className='text-sm text-gray-400 hover:text-white'
          >
            Sign Out
          </button>
        </div>

        {/* 1. BASIC PROFILE */}
        <section className='bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold text-white'>
              1. Basic Profile & Preferences
            </h2>
            <button
              onClick={handleSaveProfile}
              className='bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold transition-colors'
            >
              💾 Save Profile
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Name & Title */}
            <div>
              <label className='text-xs text-gray-400 block mb-1'>
                Full Name
              </label>
              <input
                className='w-full bg-gray-700 p-2 rounded text-white'
                value={profile.name || ''}
                onChange={(e) => handleUpdateProfile('name', e.target.value)}
              />
            </div>
            <div>
              <label className='text-xs text-gray-400 block mb-1'>
                Current Title
              </label>
              <input
                className='w-full bg-gray-700 p-2 rounded text-white'
                value={profile.title || ''}
                onChange={(e) => handleUpdateProfile('title', e.target.value)}
              />
            </div>

            {/* The Elevator Pitch */}
            <div className='col-span-2'>
              <label className='text-xs text-gray-400 block mb-1'>
                Elevator Pitch (Bio)
              </label>
              <textarea
                className='w-full bg-gray-700 p-2 rounded text-white h-24'
                value={profile.elevator_pitch || ''}
                onChange={(e) =>
                  handleUpdateProfile('elevator_pitch', e.target.value)
                }
              />
            </div>

            {/* --- NEW FIELDS FOR AI CONTEXT --- */}

            {/* Looking For */}
            <div className='col-span-2'>
              <label className='text-xs text-teal-400 block mb-1 font-bold'>
                What are you looking for?
              </label>
              <textarea
                className='w-full bg-gray-900 border border-gray-600 p-2 rounded text-white h-20 text-sm'
                placeholder='e.g. Senior roles, ownership of pipelines, startups...'
                value={profile.looking_for || ''}
                onChange={(e) =>
                  handleUpdateProfile('looking_for', e.target.value)
                }
              />
            </div>

            {/* Not Looking For */}
            <div className='col-span-2'>
              <label className='text-xs text-red-400 block mb-1 font-bold'>
                What are you NOT looking for?
              </label>
              <textarea
                className='w-full bg-gray-900 border border-gray-600 p-2 rounded text-white h-20 text-sm'
                placeholder='e.g. Help desk, legacy maintenance, non-remote...'
                value={profile.not_looking_for || ''}
                onChange={(e) =>
                  handleUpdateProfile('not_looking_for', e.target.value)
                }
              />
            </div>

            {/* Salary & Location (Sensitive Data) */}
            <div>
              <label className='text-xs text-amber-400 block mb-1 font-bold'>
                Min Salary (Annual)
              </label>
              <input
                type='number'
                className='w-full bg-gray-900 border border-gray-600 p-2 rounded text-white'
                placeholder='e.g. 120000'
                value={profile.salary_min || ''}
                onChange={(e) =>
                  handleUpdateProfile('salary_min', e.target.value)
                }
              />
            </div>
            <div>
              <label className='text-xs text-gray-400 block mb-1'>
                Location / Remote Pref
              </label>
              <input
                className='w-full bg-gray-700 p-2 rounded text-white'
                placeholder='e.g. Remote Only, or Lawrenceville, Georgia'
                value={profile.remote_preference || ''}
                onChange={(e) =>
                  handleUpdateProfile('remote_preference', e.target.value)
                }
              />
            </div>
          </div>
        </section>

        {/* 2. EXPERIENCE SECTION */}
        <section className='bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold text-white'>
              2. Experience & "Honest Context"
            </h2>
            <div className='flex gap-2'>
              <button
                onClick={handleSaveExperiences}
                className='bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold transition-colors'
              >
                💾 Save Changes
              </button>
              <button
                onClick={handleAddExperience}
                className='bg-teal-500 hover:bg-teal-400 text-black px-3 py-1 rounded text-sm transition-colors'
              >
                + Add Job
              </button>
            </div>
          </div>

          <div className='space-y-6'>
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className='border border-gray-600 p-4 rounded bg-gray-850 relative group'
              >
                <div className='flex justify-between items-start mb-4 border-b border-gray-700 pb-2'>
                  <span className='text-xs text-gray-500 font-mono'>
                    ID: {exp.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className='text-red-400 hover:text-red-200 text-sm font-bold bg-red-900/20 px-2 py-1 rounded border border-red-900/50'
                  >
                    🗑️ Delete Job
                  </button>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div>
                    <label className='text-xs text-gray-400 block mb-1'>
                      Company
                    </label>
                    <input
                      className='w-full bg-gray-700 p-2 rounded text-white'
                      value={exp.company_name}
                      onChange={(e) =>
                        handleUpdateExperience(
                          exp.id,
                          'company_name',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-400 block mb-1'>
                      Title
                    </label>
                    <input
                      className='w-full bg-gray-700 p-2 rounded text-white'
                      value={exp.title}
                      onChange={(e) =>
                        handleUpdateExperience(exp.id, 'title', e.target.value)
                      }
                    />
                  </div>
                  <div className='col-span-2 mt-4'>
                    <label className='text-xs text-gray-400 block mb-1'>
                      Job Description / Key Achievements
                    </label>
                    <textarea
                      className='w-full bg-gray-700 p-2 rounded text-white h-32 text-sm font-mono'
                      placeholder='• Led a team of 5 developers...&#10;• Migrated database to Azure...'
                      value={exp.description || ''}
                      onChange={(e) =>
                        handleUpdateExperience(
                          exp.id,
                          'description',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className='mt-4 p-4 bg-amber-900/20 border border-amber-900/50 rounded'>
                  <h3 className='text-amber-500 font-bold mb-2 text-sm uppercase tracking-wide'>
                    🔒 Private AI Context
                  </h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <textarea
                      className='w-full bg-gray-900 p-2 rounded text-sm border border-gray-700 text-gray-300 min-h-[80px]'
                      placeholder='Why did you ACTUALLY leave? (Be brutally honest)'
                      value={exp.why_left || ''}
                      onChange={(e) =>
                        handleUpdateExperience(
                          exp.id,
                          'why_left',
                          e.target.value,
                        )
                      }
                    />
                    <textarea
                      className='w-full bg-gray-900 p-2 rounded text-sm border border-gray-700 text-gray-300 min-h-[80px]'
                      placeholder='What were the biggest challenges/failures?'
                      value={exp.challenges_faced || ''}
                      onChange={(e) =>
                        handleUpdateExperience(
                          exp.id,
                          'challenges_faced',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SKILLS SECTION */}
        <section className='bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold text-teal-400'>
              3. Skills Matrix
            </h2>
            <div className='flex gap-2'>
              <button
                onClick={handleSaveSkills}
                className='bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold'
              >
                💾 Save Skills
              </button>
              <button
                onClick={handleAddSkill}
                className='bg-teal-500 text-black px-3 py-1 rounded text-sm'
              >
                + Add Skill
              </button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {skills.map((skill) => (
              <div
                key={skill.id}
                className='border border-gray-600 p-3 rounded bg-gray-900 flex flex-col gap-2'
              >
                <div className='flex gap-2'>
                  <input
                    className='bg-gray-700 p-2 rounded text-white flex-1 font-bold'
                    value={skill.skill_name}
                    onChange={(e) =>
                      handleUpdateSkill(skill.id, 'skill_name', e.target.value)
                    }
                    placeholder='Skill Name (e.g. React)'
                  />
                  <select
                    className='bg-gray-700 p-2 rounded text-white'
                    value={skill.category}
                    onChange={(e) =>
                      handleUpdateSkill(skill.id, 'category', e.target.value)
                    }
                  >
                    <option value='strong'>Strong</option>
                    <option value='moderate'>Moderate</option>
                    <option value='gap'>Weak/Gap</option>
                  </select>
                </div>
                <input
                  className='bg-gray-800 p-2 rounded text-sm text-gray-300 border border-gray-700'
                  placeholder="Honest Note (e.g. 'Good but rusty')"
                  value={skill.honest_notes || ''}
                  onChange={(e) =>
                    handleUpdateSkill(skill.id, 'honest_notes', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* 4. GAPS SECTION */}
        <section className='bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold text-amber-500'>
              4. Explicit Gaps (The Honest Stuff)
            </h2>
            <div className='flex gap-2'>
              <button
                onClick={handleSaveGaps}
                className='bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold'
              >
                💾 Save Gaps
              </button>
              <button
                onClick={handleAddGap}
                className='bg-amber-600 text-black px-3 py-1 rounded text-sm'
              >
                + Add Gap
              </button>
            </div>
          </div>
          <div className='space-y-4'>
            {gaps.map((gap) => (
              <div
                key={gap.id}
                className='border border-amber-900/50 p-4 rounded bg-amber-950/10'
              >
                <input
                  className='w-full bg-gray-700 p-2 rounded text-white mb-2 font-bold'
                  placeholder="Gap Type (e.g. 'No Java Experience')"
                  value={gap.description}
                  onChange={(e) =>
                    handleUpdateGap(gap.id, 'description', e.target.value)
                  }
                />
                <textarea
                  className='w-full bg-gray-900 p-2 rounded text-sm text-gray-300 border border-gray-700'
                  placeholder='Why is this a gap? Be brutally honest.'
                  value={gap.why_its_a_gap || ''}
                  onChange={(e) =>
                    handleUpdateGap(gap.id, 'why_its_a_gap', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
