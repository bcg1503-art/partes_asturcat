import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">Lo sentimos, no hemos podido encontrar la ruta solicitada.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
