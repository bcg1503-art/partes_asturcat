'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-2xl rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-950" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                {description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
              </div>
              <Button variant="outline" onClick={onClose} aria-label="Cerrar modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
