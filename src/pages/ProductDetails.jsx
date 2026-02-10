import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'
import ProductsList from "../components/ProductsList";
import ProductDetailsComponent from '../components/ProductDetailsComponent';
export default function ProductDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const title = t("products.relatedProducts");
  return (
    <div>
       <Header/>
      <ProductDetailsComponent offerId={id}/>
       <ProductsList title={title} limit={8}/>
       <FooterArabic/>
    </div>
  )
}
