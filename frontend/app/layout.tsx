import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SaaSquatch Platform',
  description: 'AI-powered SaaS acquisition lead enrichment',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/leads" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                S
              </span>
              <span className="text-base font-semibold tracking-tight text-white">
                SaaSquatch <span className="text-slate-400">Platform</span>
              </span>
            </Link>
            <nav className="text-sm text-slate-400">
              <Link href="/leads" className="rounded-lg px-3 py-1.5 transition hover:bg-surface-raised hover:text-white">
                Leads
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
