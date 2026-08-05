import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ alt = 'VICheck', className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src='/vcheck3-logo-40.png'
      alt={alt}
      width={48}
      height={48}
      sizes='48px'
      priority={priority}
      className={cn('size-9 rounded-full object-cover', className)}
    />
  );
}
