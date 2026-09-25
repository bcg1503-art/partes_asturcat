import Link from 'next/link';
import { CalendarCheck, ClipboardCheck, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pasos = [
  {
    icon: CalendarCheck,
    title: 'Un registro por jornada',
    description: 'Cada trabajador apunta fecha, cliente y horas. Se agrupa solo en el parte del mes correspondiente, sin duplicados.'
  },
  {
    icon: ClipboardCheck,
    title: 'Revisión del equipo',
    description: 'El administrador valida cada parte, uno a uno o cerrando el mes entero de golpe cuando toca.'
  },
  {
    icon: FileDown,
    title: 'Informe listo para enviar',
    description: 'Descarga el PDF mensual con el membrete de Asturcat: número de parte, trabajador, horas y cliente.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/branding/asturcat-logo.png" alt="Asturcat" className="h-12 w-12 rounded-xl" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asturcat Construcciones</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">asturcatconstrucciones.com</p>
          </div>
        </div>

        <div className="mt-14 max-w-2xl space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Partes de trabajo</h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Reformas, albañilería, pintura y paneles sándwich en Barcelona y área metropolitana. Aquí registramos
            las jornadas de cada trabajador y cerramos los partes mensuales cliente a cliente.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/signin">
            <Button className="min-w-[10rem]">Iniciar sesión</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="min-w-[10rem]">Crear cuenta</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {pasos.map((paso) => {
            const Icon = paso.icon;
            return (
              <div key={paso.title} className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/85">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{paso.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{paso.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
