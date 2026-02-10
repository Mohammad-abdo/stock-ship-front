import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProductsList from '../components/ProductsList'
import RecommendedProducts from '../components/RecommendedProducts'
import CompanyAdsComponent from '../components/CompanyAdsComponent'
import { MainLayout } from '../components/Layout'

export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const { traderId } = useParams();
  const title = t("products.mostPurchased");
  return (
    <MainLayout>
      <CompanyAdsComponent traderId={traderId}/>
      <RecommendedProducts/>
      <ProductsList title={title}/>
    </MainLayout>
  )
}
