import type { Icon } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function StatCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string;
  value: string;
  description: string;
  icon: Icon;
}) {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardDescription className='flex items-center gap-2'>
          <Icon />
          {title}
        </CardDescription>
        <CardTitle className='text-2xl tabular-nums'>{value}</CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-xs'>{description}</CardContent>
    </Card>
  );
}
