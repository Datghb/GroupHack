import PageContainer from '@/components/layout/page-container';
import { ShowcasePage } from '@/features/showcase/components/showcase-page';

export const metadata = { title: 'Showcase sản phẩm' };
export default function StudentShowcasePage() {
  return (
    <PageContainer
      pageTitle='Showcase sản phẩm'
      pageDescription='Khám phá và đánh giá website của các nhóm.'
      className='showcase-background'
    >
      <ShowcasePage />
    </PageContainer>
  );
}
