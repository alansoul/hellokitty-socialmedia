import { redirect } from 'next/navigation';

export default function AuthWebRootPage() {
  // Instantly redirect users to the dashboard when they visit the root URL
  redirect('/dashboard');
}