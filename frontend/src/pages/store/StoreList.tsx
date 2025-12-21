import { useLoaderData } from '@tanstack/react-router';
import { ProductGrid } from '@/components/store/ProductGrid';
import { SEO } from '@/components/SEO';
import PageWrapper from '@/components/layout/PageWrapper';

export default function StoreList() {
  const { products } = useLoaderData({ from: '/store/' });

  return (
    <PageWrapper>
      <SEO
        title="Courses - Store"
        description="Browse our collection of courses and start learning today"
        type="website"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Courses</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of courses and start your learning journey
          </p>
        </header>

        {/* Products Grid */}
        <ProductGrid products={products || []} />
      </div>
    </PageWrapper>
  );
}
