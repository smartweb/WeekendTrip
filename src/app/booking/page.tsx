import { BookingClient } from "./booking-client";

export const dynamic = "force-dynamic";

export default function BookingPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  return <BookingClient sp={searchParams} />;
}
