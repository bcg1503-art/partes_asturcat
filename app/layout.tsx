import type { Metadata } from 'next';
import '../styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Partes de Trabajo',
  description: 'Gestión profesional de partes de trabajo para empresa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-cyan-200 selection:text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
