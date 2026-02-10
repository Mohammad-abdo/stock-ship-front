import React from 'react'
import OrderTrackingCard from '../components/OrderTrackingCard'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'

export default function OrderTrackingCardPage() {
  return (
    <div>
      <Header/>
      <OrderTrackingCard/>
      <FooterArabic/>
    </div>
  )
}
