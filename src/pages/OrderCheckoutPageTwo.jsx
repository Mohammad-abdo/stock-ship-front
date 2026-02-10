import React from 'react'
import CheckoutSummaryComponent from '../components/CheckoutSummaryComponent'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'

export default function OrderCheckoutPageTwo() {
  return (
    <div>
      <Header/>
      <CheckoutSummaryComponent/>
      <FooterArabic/>
    </div>
  )
}
