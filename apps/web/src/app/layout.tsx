import './global.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'HelloKitty Social',
  description: 'The ultimate enterprise social platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* ✨ Mount the Toaster globally */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
