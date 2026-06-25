import './global.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'HelloKitty Auth Platform',
  description: 'Enterprise Identity Provider',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
