import './globals.css';

export const metadata = {
  title: 'FresherAlert — Fresher Job Alerts on Telegram',
  description:
    'Get fresher job alerts on Telegram instantly. We scrape 6+ job sites every 2 minutes so you apply first.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
