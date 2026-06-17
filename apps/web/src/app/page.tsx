// apps/web/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Post } from '@hellokitty/types'; // ✨ Import the strict type from our shared library!

// Provide a safe fallback so cloud builds (GitHub/Vercel) don't crash
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export default function Feed() {
  // ✨ Replace 'any[]' with 'Post[]'
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      // ✨ MAKE SURE THIS IS THE FULL URL TO YOUR SOCIAL API (Port 3002)
      const response = await fetch('http://localhost:3002/api/posts');

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    formData.append('authorId', 'test-user-id');
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      setContent('');
      setFile(null);
      fetchPosts();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Internal Feed</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl shadow-md border mb-8"
      >
        <textarea
          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 mb-4"
          placeholder="What's happening?"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-full font-bold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Publish'}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-xl shadow-sm border"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold mr-3">
                {post.author?.displayName?.[0] || 'U'}
              </div>
              <div>
                <h3 className="font-bold">{post.author?.displayName}</h3>
                <p className="text-sm text-gray-500">
                  @{post.author?.username}
                </p>
              </div>
            </div>

            <p className="text-lg mb-4">{post.content}</p>

            {post.mediaUrl && (
              <div className="rounded-xl overflow-hidden mb-4 bg-gray-100">
                {post.mediaType === 'VIDEO' ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="w-full max-h-96 object-contain"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt="Media"
                    className="w-full max-h-96 object-contain"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
