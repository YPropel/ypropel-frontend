import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../apiClient'; // Importing apiFetch

const CreateCompany = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !location || !industry) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await apiFetch('/companies', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          location,
          industry,
          logoUrl,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        // Redirect to job posting page after creating the company profile
        router.push('/post-job');
      } else {
        setError('Failed to create company profile');
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Create Your Company Profile</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Company Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Description</label>
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
          <label className="block">Industry</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Logo URL (optional)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Create Profile
        </button>
      </form>
    </div>
  );
};

export default CreateCompany;
