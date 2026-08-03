'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { teams } from '../api/data';
import { cn } from '@/lib/utils';

const config = { progress: { label: 'Tiến độ', color: 'var(--chart-1)' } } satisfies ChartConfig;
const matrix = [
  [100, 100, 75, 0],
  [100, 100, 45, 0],
  [100, 70, 20, 0],
  [100, 40, 0, 0]
];

export function CommunityProgress() {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ các nhóm</CardTitle>
          <CardDescription>Tỷ lệ hoàn thành, không phải bảng xếp hạng điểm số.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className='h-72 w-full'>
            <BarChart accessibilityLayer data={teams} layout='vertical' margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type='number' domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey='name' type='category' tickLine={false} axisLine={false} width={88} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='progress' fill='var(--color-progress)' radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ma trận checkpoint</CardTitle>
          <CardDescription>Trạng thái công khai của từng nhóm theo checkpoint.</CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhóm</TableHead>
                {['CP1', 'CP2', 'CP3', 'CP4'].map((item) => (
                  <TableHead key={item} className='text-center'>
                    {item}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, row) => (
                <TableRow key={team.id}>
                  <TableCell className='font-medium'>{team.name}</TableCell>
                  {matrix[row].map((value, column) => (
                    <TableCell key={column} className='text-center'>
                      <span
                        className={cn(
                          'inline-flex size-7 items-center justify-center rounded-full',
                          value === 100
                            ? 'bg-primary text-primary-foreground'
                            : value > 0
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-muted text-muted-foreground'
                        )}
                        aria-label={`${value}%`}
                      >
                        {value === 100 ? <Icons.check /> : value > 0 ? '●' : '○'}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
