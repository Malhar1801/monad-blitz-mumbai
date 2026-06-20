import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import Navbar from '@/components/Navbar';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'PromptFi — Prompt Engineering Marketplace on Monad',
  description: 'Train. Evaluate. Verify. Sell. Every prompt is scored by 4 AI agents before it reaches buyers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={ibmPlexMono.variable}>
      <body className="bg-cream font-mono min-h-screen">
        <WalletProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
