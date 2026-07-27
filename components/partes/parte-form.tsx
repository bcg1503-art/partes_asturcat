'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Cliente, Obra } from '@/types';
import { cn } from '@/lib/utils';

const parteSchema = z.object({
  fecha: z.string().nonempty('Selecciona la fecha'),
  cliente_id: z.string().nonempty('Selecciona el cliente'),
  obra_id: z.string().nonempty('Selecciona la obra'),
  horas: z.string().nonempty('Introduce las horas trabajadas'),
  descripcion: z.string().nonempty('Describe el trabajo realizado'),
  materiales: z.string().optional(),
  observaciones: z.string().optional()
});

type ParteFormValues = z.infer<typeof parteSchema>;

interface ParteFormProps {
  clientes: Cliente[];
  obras: Obra[];
  defaultValues?: Partial<ParteFormValues>;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export function ParteForm({ clientes, obras, defaultValues, action, submitLabel }: ParteFormProps) {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ParteFormValues>({
    resolver: zodResolver(parteSchema),
    defaultValues
  });

  const fechaValue = watch('fecha');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 3;
    setCanvasContext(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (defaultValues && defaultValues.fecha) {
      setValue('fecha', defaultValues.fecha);
    }
  }, [defaultValues, setValue]);

  const handlePointerDown = () => setDrawing(true);
  const handlePointerUp = () => setDrawing(false);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasContext || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    canvasContext.lineTo(x, y);
    canvasContext.stroke();
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasContext) return;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl(null);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
  };

  const onSubmit = async (values: ParteFormValues) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('fecha', values.fecha);
      formData.append('cliente_id', values.cliente_id);
      formData.append('obra_id', values.obra_id);
      formData.append('horas', values.horas);
      formData.append('descripcion', values.descripcion);
      formData.append('materiales', values.materiales ?? '');
      formData.append('observaciones', values.observaciones ?? '');

      if (signatureUrl) {
        formData.append('firma', signatureUrl);
      }

      const files = fileInputRef.current?.files;
      if (files) {
        Array.from(files).forEach((file) => {
          formData.append('fotos', file);
        });
      }

      await action(formData);
      setMessageType('success');
      setMessage('Parte guardado correctamente.');
    } catch (error) {
      setMessageType('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Error guardando el parte.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientOptions = useMemo(
    () => ({
      fecha: true,
      cliente_id: true,
      obra_id: true,
      horas: true,
      descripcion: true,
      materiales: true,
      observaciones: true
    }),
    []
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" {...register('fecha')} />
          {errors.fecha ? <p className="text-sm text-rose-600">{errors.fecha.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select {...register('cliente_id')}>
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </Select>
          {errors.cliente_id ? <p className="text-sm text-rose-600">{errors.cliente_id.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Obra</Label>
          <Select {...register('obra_id')}>
            <option value="">Selecciona una obra</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nombre}
              </option>
            ))}
          </Select>
          {errors.obra_id ? <p className="text-sm text-rose-600">{errors.obra_id.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Horas trabajadas</Label>
          <Input type="number" step="0.25" min="0" {...register('horas')} />
          {errors.horas ? <p className="text-sm text-rose-600">{errors.horas.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción del trabajo</Label>
        <Textarea {...register('descripcion')} />
        {errors.descripcion ? <p className="text-sm text-rose-600">{errors.descripcion.message}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Material utilizado</Label>
          <Textarea {...register('materiales')} />
        </div>
        <div className="space-y-2">
          <Label>Observaciones</Label>
          <Textarea {...register('observaciones')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fotos</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="mt-2 block w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label>Firma</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleClearSignature}>
              Limpiar
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveSignature}>
              Guardar firma
            </Button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
          <canvas
            ref={canvasRef}
            width={720}
            height={240}
            className={cn('w-full rounded-2xl border border-slate-300 bg-white', signatureUrl ? 'ring-2 ring-brand-500' : '')}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
          />
        </div>
        {signatureUrl ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Firma lista para subir.
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Dibuja tu firma en el lienzo y presiona "Guardar firma".</p>
        )}
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
