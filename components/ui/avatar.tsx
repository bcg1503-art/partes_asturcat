import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  nombre: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-3xl'
};

export function Avatar({ nombre, avatarUrl, size = 'md', className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={nombre} className={cn('flex-none rounded-full object-cover', sizeClasses[size], className)} />
    );
  }

  return (
    <div className={cn('grid flex-none place-items-center rounded-full bg-brand-600 font-semibold text-white', sizeClasses[size], className)}>
      {getInitials(nombre)}
    </div>
  );
}
