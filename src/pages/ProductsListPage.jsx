import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsListComponent from '../components/ProductsListComponent'
import { MainLayout } from '../components/Layout'

export default function ProductsListPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const categorySlug = searchParams.get('category');
  const search = searchParams.get('q') || searchParams.get('search');

  return (
    <MainLayout>
      <ProductsListComponent categoryId={categoryId} categorySlug={categorySlug} search={search}/>
    </MainLayout>
  )
}
