import PageContainer from '@/components/layout/page-container';
import { ShowcasePage } from '@/features/showcase/components/showcase-page';

export const metadata = { title: 'Showcase sản phẩm' };
export default function TeacherShowcasePage() {
  return (
    <PageContainer
      pageTitle='Showcase sản phẩm'
      pageDescription='Theo dõi sản phẩm và phản hồi chéo giữa các nhóm.'
      className='showcase-background'
    >
      <ShowcasePage />
    </PageContainer>
  );
}
