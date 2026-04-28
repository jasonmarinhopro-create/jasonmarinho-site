import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { BOOKING_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('maitriser-booking-com-algorithme-genius', BOOKING_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'maitriser-booking-com-algorithme-genius',
    headerTitle: 'Formation Booking.com',
    staticContent: BOOKING_FORMATION,
  })
}
