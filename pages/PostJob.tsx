import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../apiClient'; // Importing apiFetch

const PostJob = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !location || !salary || !jobType || !applyUrl || !companyId) {
      setError('All fields are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await apiFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          companyId,
          title,
          description,
          location,
          salary,
          jobType,
          applyUrl,
          expiresAt,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Redirect to job listing page after successful job posting
        router.push('/jobs');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post job');
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Post a Job</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Job Title</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Job Description</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Location</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Salary</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Job Type</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Application URL</label>
          <input
            type="url"
            className="w-full p-2 border border-gray-300"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Expiration Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <div>
          <label className="block">Company ID</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300"
            value={companyId || ''}
            onChange={(e) => setCompanyId(Number(e.target.value))}
            required
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Post Job
        </button>
      </form>
    </div>
  );
};

export default PostJob;
