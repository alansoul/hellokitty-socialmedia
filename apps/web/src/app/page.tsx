'use client';

import { useEffect, useState } from 'react';
import { Post } from '@hellokitty/types';
import { Loader2 } from 'lucide-react'; // ✨ For a beautiful loading spinner

const SOCIAL_API =
  process.env.NEXT_PUBLIC_SOCIAL_API_URL || 'http://localhost:3002/api';
// ✨ Define where the Auth App lives
const AUTH_APP_URL =
  process.env.NEXT_PUBLIC_AUTH_APP_URL || 'http://localhost:3004';

// ✨ PKCE helper: Generates a high-entropy cryptographically random string (code_verifier)
function generateCodeVerifier(): string {
  if (typeof window === 'undefined' || !window.crypto) return ''; // Guard
  const array = new Uint32Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).substring(-2),
  ).join('');
}

// ✨ PKCE helper: Hashes the verifier with SHA-256 and base64url encodes it (code_challenge)
async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window === 'undefined' || !verifier) return ''; // Guard
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // ✨ Add this to prevent UI flickering while checking the token!
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const initiateOAuthRedirect = async () => {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || '';
    const redirectUri = encodeURIComponent('http://localhost:3000/callback');

    // 1. Generate the PKCE parameters
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // 2. Save the verifier in sessionStorage to verify during the callback exchange
    sessionStorage.setItem('code_verifier', verifier);

    // 3. Redirect the user to the Auth Portal passing PKCE parameters
    window.location.href = `${AUTH_APP_URL}/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`;
  };

  useEffect(() => {
    // Check auth instantly when the page loads
    const token = localStorage.getItem('access_token');
    if (!token) {
      initiateOAuthRedirect();
    } else {
      setIsCheckingAuth(false);
      fetchPosts();
    }
  }, []);

  const fetchPosts = async () => {
    try {
      // ✨ 1. Grab the token from LocalStorage
      const token = localStorage.getItem('access_token');

      // If no token exists, kick them back to the login page!
      if (!token) {
        initiateOAuthRedirect();
        return;
      }

      // ✨ 2. Pass the token to the Social API
      const response = await fetch(`${SOCIAL_API}/posts`, {
        headers: {
          // We no longer need to pass the "Authorization: Bearer" header manually!
          // The browser will automatically attach the "access_token" cookie!
        },
        credentials: 'include', // ✨ Crucial: Tells the browser to send cookies!
      });

      // ✨ THE FIX: If the token is expired, delete it and kick them out!
      if (response.status === 401) {
        initiateOAuthRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      initiateOAuthRedirect();
      return;
    }

    const formData = new FormData();
    formData.append('content', content);

    // ✨ 3. WE DELETED THE FAKE authorId!
    // The NestJS backend will automatically extract the ID from the JWT!

    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch(`${SOCIAL_API}/posts`, {
        method: 'POST',
        headers: {
          // ✨ 4. Pass the token here as well
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // ✨ Also kick them out here if token expired while typing a post
      if (res.status === 401) {
        localStorage.removeItem('access_token');
        initiateOAuthRedirect();
        return;
      }

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

  // ✨ Show a loading screen while verifying the token so the page doesn't flash
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

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
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold mr-3 uppercase">
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
