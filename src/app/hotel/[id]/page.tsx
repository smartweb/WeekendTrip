import { HotelDetailClient } from "./hotel-client";

export const dynamic = "force-dynamic";

export default function HotelDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <HotelDetailClient
      hotelId={params.id}
      searchOfferId={searchParams.searchOfferId ?? ""}
      checkIn={searchParams.checkIn ?? ""}
      checkOut={searchParams.checkOut ?? ""}
      name={searchParams.name ?? ""}
      starRating={searchParams.starRating ?? ""}
      starTag={searchParams.starTag ?? ""}
      score={searchParams.score ?? ""}
      reviewCount={searchParams.reviewCount ?? ""}
      address={searchParams.address ?? ""}
      brandName={searchParams.brandName ?? ""}
      minPrice={searchParams.minPrice ?? ""}
      tagsRaw={searchParams.tags ?? ""}
      facilitiesRaw={searchParams.facilities ?? ""}
      mainPicture={searchParams.mainPicture ?? ""}
      back={searchParams.back ?? "/"}
    />
  );
}
