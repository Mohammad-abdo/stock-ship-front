import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsListComponent from '../components/ProductsListComponent'
import { MainLayout } from '../components/Layout'

export default function ProductsListPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const categorySlug = searchParams.get('category');
  const search = searchParams.get('q') || searchParams.get('search');
  const searchByImage = searchParams.get('searchByImage') === '1';
  const imageUrl = searchParams.get('imageUrl') || null;

  return (
    <MainLayout>
      <ProductsListComponent
        categoryId={categoryId}
        categorySlug={categorySlug}
        search={search}
        searchByImage={searchByImage}
        imageUrl={imageUrl}
      />
    </MainLayout>
  );
}
