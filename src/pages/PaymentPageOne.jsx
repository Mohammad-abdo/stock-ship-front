import React, { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import PaymentCardForm from '../components/PaymentCardOne'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'
import { dealService } from '../services/dealService'
import { ROUTES } from '../routes'

export default function PaymentPageOne() {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const urlDealId = params.dealId || null
  const [deal, setDeal] = useState(location.state?.deal ?? null)
  const [dealId, setDealId] = useState(location.state?.dealId ?? urlDealId)
  const [platformSettings, setPlatformSettings] = useState(location.state?.platformSettings ?? null)
  const [loading, setLoading] = useState(!!urlDealId && !location.state?.deal)
  const fromQuote = location.state?.fromQuote === true || !!urlDealId

  useEffect(() => {
    if (urlDealId && !location.state?.deal) {
      dealService.getDealById(urlDealId)
        .then((res) => {
          const data = res.data?.data || res.data
          const d = data?.deal || data
          setDeal(d)
          setDealId(urlDealId)
          if (data?.platformSettings) setPlatformSettings(data.platformSettings)
        })
        .catch(() => navigate(ROUTES.NEGOTIATIONS))
        .finally(() => setLoading(false))
    }
  }, [urlDealId, location.state?.deal, navigate])

  if (loading) {
    return (
      <div>
        <Header/>
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
        <FooterArabic/>
      </div>
    )
  }

  return (
    <div>
        <Header/>
        <PaymentCardForm deal={deal} dealId={dealId} fromQuote={fromQuote} platformSettings={platformSettings} />
        <FooterArabic/>
    </div>
  )
}
