import { PackageDetailClient } from "./detail-client";

export const dynamic = "force-dynamic";

export default function PackageDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {
    origin?: string;
    checkIn?: string;
    nights?: string;
    adults?: string;
    children?: string;
    hotelMaxPerNight?: string;
  };
}) {
  return (
    <PackageDetailClient
      id={params.id}
      origin={searchParams.origin ?? "SZX"}
      depart={searchParams.checkIn ?? ""}
      nights={Number(searchParams.nights ?? 2)}
      adults={Number(searchParams.adults ?? 2)}
      childCount={Number(searchParams.children ?? 1)}
      hotelMaxPerNight={Number(searchParams.hotelMaxPerNight ?? 0)}
    />
  );
}
