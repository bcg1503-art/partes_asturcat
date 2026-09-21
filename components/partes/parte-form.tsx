'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Cliente } from '@/types';
import { cn } from '@/lib/utils';

const parteSchema = z.object({
  fecha: z.string().nonempty('Selecciona la fecha'),
  cliente_id: z.string().nonempty('Selecciona el cliente'),
  horas: z.string().nonempty('Introduce las horas trabajadas'),
  observaciones: z.string().optional()
});

type ParteFormValues = z.infer<typeof parteSchema>;

interface ParteFormProps {
  clientes: Cliente[];
  numeroPartee?: string; // Formatted as "00001"
  /** When editing a single registro the cliente is fixed by the parent parte and can't change. */
  clienteFijo?: { id: string; nombre: string };
  defaultValues?: Partial<ParteFormValues>;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export function ParteForm({ clientes, numeroPartee, clienteFijo, defaultValues, action, submitLabel }: ParteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ParteFormValues>({
    resolver: zodResolver(parteSchema),
    defaultValues: clienteFijo ? { ...defaultValues, cliente_id: clienteFijo.id } : defaultValues
  });

  const onSubmit = async (values: ParteFormValues) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('fecha', values.fecha);
      formData.append('cliente_id', values.cliente_id);
      formData.append('horas', values.horas);
      formData.append('observaciones', values.observaciones ?? '');

      await action(formData);
      setMessageType('success');
      setMessage('Registro guardado correctamente.');
    } catch (error) {
      setMessageType('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Error guardando el registro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      {numeroPartee ? (
        <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/30">
          <p className="text-sm text-brand-600 dark:text-brand-300">Número de parte</p>
          <p className="mt-1 text-2xl font-semibold text-brand-900 dark:text-brand-100">{numeroPartee}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" {...register('fecha')} />
          {errors.fecha ? <p className="text-sm text-rose-600">{errors.fecha.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          {clienteFijo ? (
            <>
              <input type="hidden" {...register('cliente_id')} value={clienteFijo.id} />
              <p className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {clienteFijo.nombre}
              </p>
            </>
          ) : (
            <>
              <Select {...register('cliente_id')}>
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </Select>
              {errors.cliente_id ? <p className="text-sm text-rose-600">{errors.cliente_id.message}</p> : null}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horas trabajadas</Label>
        <Input type="number" step="0.25" min="0" {...register('horas')} />
        {errors.horas ? <p className="text-sm text-rose-600">{errors.horas.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Observaciones (opcional)</Label>
        <Textarea placeholder="Notas adicionales sobre el trabajo realizado..." {...register('observaciones')} />
      </div>

      {message ? (
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            messageType === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
          )}
        >
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
