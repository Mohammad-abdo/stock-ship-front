import React from 'react'
import Header from '../components/Header'
import NotificationsList from '../components/NotificationsList'
import FooterArabic from '../components/FooterArabic'

export default function Notification() {
  return (
    <div>
      <Header/>
      <NotificationsList/>
      <FooterArabic/>
    </div>
  )
}
