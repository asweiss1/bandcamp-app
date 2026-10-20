"use client";

import { Children } from "react";
import Link from "next/link";
import { getMusician } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { isYourMove, profileId } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { roleLabel } from "@/components/role-switcher";
import { TuneInRequests } from "@/components/band-links";
import { BookActions } from "@/components/book-actions";
import { TrustPanel } from "@/components/trust-panel";
import { BookingRow } from "@/components/booking-row";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const { snapshot } = useApp();
  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId, snapshot.fanId);
  if (snapshot.role === "fan") {
    return (
      <PageFrame>
        <BookActions tone="desk" />
        <PageIntro
          eyebrow="Profile"
          title={`${name}'s shows`}
          lede="Confirmed shows from bands and rooms you follow, plus what's near home. Offers stay on the band and venue desks."
          actions={
            <>
              <Button asChild className="h-10">
                <Link href="/shows">What&apos;s happening</Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href="/bands">Find bands</Link>
              </Button>
            </>
          }
        />
        <TrustPanel />
      </PageFrame>
    );
  }
  const mine = snapshot.bookings.filter((booking) => {
    if (snapshot.role === "band") {
      if (booking.bandId === snapshot.bandId) return true;
      const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
      return bill?.members.some((member) => member.bandId === snapshot.bandId) ?? false;
    }
    if (snapshot.role === "venue") return booking.venueId === snapshot.venueId;
    return false;
  });
  const moves = mine.filter((booking) => isYourMove(booking, snapshot));
  const waiting = mine.filter(
    (booking) =>
      !isYourMove(booking, snapshot) &&
      booking.status !== "accepted" &&
      booking.status !== "declined",
  );
  const confirmed = mine.filter((booking) => booking.status === "accepted");
  const declined = mine.filter((booking) => booking.status === "declined");
  const openDates =
    snapshot.role === "venue"
      ? snapshot.openDates.filter((item) => item.venueId === snapshot.venueId)
      : [];
  const myId = profileId(snapshot);
  const myListings = snapshot.listings.filter(
    (listing) => listing.posterRole === snapshot.role && listing.posterId === myId,
  );
  const incomingNotes = snapshot.interests.filter((interest) =>
    myListings.some((listing) => listing.id === interest.listingId),
  );
  const sentNotes = snapshot.interests.filter(
    (interest) => interest.fromRole === snapshot.role && interest.fromId === myId,
  );

  return (
    <PageFrame>
      <BookActions tone="desk" />
      <PageIntro
        eyebrow="Profile"
        title={`${name}'s profile`}
        lede={
          snapshot.role === "musician"
            ? "Listings you posted and notes exchanged on the board. Gigs are booked from a band or venue role."
            : "Requests, offers, counters, and dates that are actually on the calendar."
        }
        actions={
          <>
            {snapshot.role === "venue" ? (
              <Button asChild className="h-10">
                <Link href="/dates/new">Post a date</Link>
              </Button>
            ) : snapshot.role === "band" ? (
              <Button asChild className="h-10">
                <Link href="/tour">Open the route</Link>
              </Button>
            ) : (
              <Button asChild className="h-10">
                <Link href="/board/new">Post a listing</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-10">
              <Link href="/bands">Find bands</Link>
            </Button>
            {snapshot.role !== "musician" ? (
              <Button asChild variant="outline" className="h-10">
                <Link href="/bills">Shared bills</Link>
              </Button>
            ) : null}
          </>
        }
      />
      <TuneInRequests />
      {snapshot.role !== "musician" ? (
        <div className="mt-8 grid gap-8">
          <Section title="Your move" empty="Nothing is waiting on you.">
            {moves.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                openDate={snapshot.openDates.find((item) => item.id === booking.openDateId)}
                emphasize="Needs an answer"
              />
            ))}
          </Section>
          <Section title="Waiting on them" empty="No outgoing conversations.">
            {waiting.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                openDate={snapshot.openDates.find((item) => item.id === booking.openDateId)}
              />
            ))}
          </Section>
          <Section title="Confirmed" empty="No confirmed gigs yet.">
            {confirmed.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                openDate={snapshot.openDates.find((item) => item.id === booking.openDateId)}
              />
            ))}
          </Section>
          {declined.length > 0 ? (
            <Section title="Declined" empty="">
              {declined.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  openDate={snapshot.openDates.find((item) => item.id === booking.openDateId)}
                />
              ))}
            </Section>
          ) : null}
          {snapshot.role === "venue" ? (
            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="font-display text-3xl">Your open dates</h2>
                <Link href="/dates" className="text-sm font-medium text-rust">
                  Marketplace
                </Link>
              </div>
              <div className="grid gap-2">
                {openDates
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((openDate) => {
                    const talks = snapshot.bookings.filter(
                      (booking) =>
                        booking.openDateId === openDate.id && booking.status !== "declined",
                    );
                    const filled = talks.some((booking) => booking.status === "accepted");
                    return (
                      <Link
                        key={openDate.id}
                        href={`/dates/${openDate.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
                      >
                        <span>
                          <span className="block font-medium">
                            {openDate.date} · {slotLine(openDate.showTime, openDate.daypart)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {talks.length} active conversation{talks.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <StatusPill status={filled ? "filled" : talks.length ? "in-talks" : "open"} />
                      </Link>
                    );
                  })}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {snapshot.role === "band" ? (
        <div className="mt-10">
          <Section title="Permits and fairs" empty="No permit or festival applications yet.">
            {snapshot.applications
              .filter((application) => application.bandId === snapshot.bandId && application.status !== "declined")
              .map((application) => {
                const opportunity = snapshot.opportunities.find((item) => item.id === application.opportunityId);
                if (!opportunity) return null;
                return (
                  <Link
                    key={application.id}
                    href={`/opportunities/${opportunity.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
                  >
                    <span>
                      <span className="block font-medium">{opportunity.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {opportunity.city} · {opportunity.kind === "permit" ? "Street permit" : "Fair"}
                      </span>
                    </span>
                    <StatusPill status={application.status} />
                  </Link>
                );
              })}
          </Section>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8">
        <Section
          title="Board listings"
          empty={
            snapshot.role === "musician"
              ? `${getMusician(snapshot.musicianId)?.name ?? "You"} haven't posted yet.`
              : "No listings from this profile."
          }
        >
          {myListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/board/${listing.id}`}
              className="block rounded-xl border bg-card px-4 py-3"
            >
              <span className="font-medium">{listing.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {listing.instrument} · {listing.city} · {listing.paid ? listing.payNote : "Unpaid"}
              </span>
            </Link>
          ))}
        </Section>
        <Section title="Notes you received" empty="No one has written yet.">
          {incomingNotes.map((interest) => {
            const listing = snapshot.listings.find((item) => item.id === interest.listingId);
            return (
              <Link
                key={interest.id}
                href={listing ? `/board/${listing.id}` : "/board"}
                className="block rounded-xl border bg-card px-4 py-3"
              >
                <span className="font-medium">{interest.fromName}</span>
                <span className="mt-1 block text-sm">{interest.message}</span>
              </Link>
            );
          })}
        </Section>
        <Section title="Notes you sent" empty="You haven't reached out.">
          {sentNotes.map((interest) => (
            <div key={interest.id} className="rounded-xl border bg-card px-4 py-3 text-sm">
              <p className="font-medium">To a listing</p>
              <p className="mt-1">{interest.message}</p>
            </div>
          ))}
        </Section>
      </div>
      <TrustPanel />
    </PageFrame>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-3xl">{title}</h2>
      {Children.count(children) === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-2">{children}</div>
      )}
    </section>
  );
}
