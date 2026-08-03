import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

export default function CheckpointPage() {
  return (
    <PageContainer
      pageTitle='Prototype tương tác'
      pageDescription='Checkpoint nhóm · chỉ trưởng nhóm có thể nộp chính thức.'
    >
      <div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
        <Card>
          <CardHeader>
            <CardTitle>Cập nhật tiến độ</CardTitle>
            <CardDescription>
              Lưu bản nháp thường xuyên để giảng viên theo dõi và hỗ trợ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Phần trăm hoàn thành</FieldLabel>
                <Slider defaultValue={[75]} max={100} step={5} />
                <FieldDescription>Hiện tại: 75%</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor='progress-note'>Ghi chú tiến độ</FieldLabel>
                <Textarea
                  id='progress-note'
                  placeholder='Nhóm đã hoàn thành gì? Đang gặp khó khăn nào?'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='evidence-link'>Liên kết minh chứng</FieldLabel>
                <Input id='evidence-link' type='url' placeholder='https://...' />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className='justify-end gap-2'>
            <Button variant='outline'>Lưu bản nháp</Button>
            <Button>Nộp checkpoint</Button>
          </CardFooter>
        </Card>
        <div className='flex flex-col gap-4'>
          <Alert>
            <Icons.info />
            <AlertTitle>Hướng dẫn công khai</AlertTitle>
            <AlertDescription>
              Prototype cần thể hiện ít nhất ba luồng chính và có thể kiểm thử trên thiết bị di
              động.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Mốc thời gian</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-3 text-sm'>
              <div>
                <p className='font-medium'>Mở checkpoint</p>
                <p className='text-muted-foreground'>30/07/2026 · 08:00</p>
              </div>
              <div>
                <p className='font-medium'>Hạn nộp</p>
                <p className='text-muted-foreground'>07/08/2026 · 23:59</p>
              </div>
              <div>
                <p className='font-medium'>Đóng checkpoint</p>
                <p className='text-muted-foreground'>10/08/2026 · 23:59</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
