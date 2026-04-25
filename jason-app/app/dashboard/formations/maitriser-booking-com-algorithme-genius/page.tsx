import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { BOOKING_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'maitriser-booking-com-algorithme-genius',
    headerTitle: 'Formation Booking.com',
    staticContent: BOOKING_FORMATION,
  })
}
