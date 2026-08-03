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
      src='/vicheck-logo.png'
      alt={alt}
      width={512}
      height={512}
      priority={priority}
      className={cn('size-8 rounded-lg object-cover', className)}
    />
  );
}
