# Beds24 pricing and Google Vacation Rentals notes

Last reviewed: 2026-05-07

This note focuses only on Newlands Cottages pricing, booking rules, and how those rules affect channel output, especially Google for Vacation Rentals. It uses the read-only Beds24 API snapshot from 2026-05-07. No Beds24 write calls were made.

## Decided requirements

- Newlands sells one physical cottage: Clarkia Cottage.
- Pricing is ZAR 1800 per night for 1-2 guests, ZAR 2100 for 3 guests, and ZAR 2400 for 4 guests.
- Minimum stay is 3 nights.
- Weekday minimum booking notice is 2 days before check-in.
- Short-term bookings with arrival in 7 days or less should pay in full immediately.
- Weekend check-ins on Saturday or Sunday should be request-first/manual confirmation when they are 2-14 days out, and deposit-confirmed when they are more than 14 days out.
- Same-day turnover is not allowed: one guest should not check out on the same date another guest checks in.
- Guest self-cancellation should be allowed until 30 days before arrival.
- Yoco refund automation is out of scope for the first payment-gateway middleware version. Treat it as a later V2 candidate after the live payment flow is stable.

For the detailed structured target and gap analysis after these clarifications, see [beds24-newlands-pricing-rules-target-and-gap-analysis.md](./beds24-newlands-pricing-rules-target-and-gap-analysis.md).

## Current Beds24 pricing state

Canonical direct-booking room candidate: `621440`.

Room-level rules:

| Field | Current value |
| --- | --- |
| Room | `621440` / `Clarkia Cottage` |
| Quantity | 1 |
| Room minimum stay | 1 |
| Room maximum stay | 365 |
| Restriction strategy | `stayThrough` |
| Offer 1 | `Standard Offer`, enabled `always`, booking type `default` |

Property booking rules:

| Field | Current value | Target |
| --- | --- | --- |
| `bookingType` | `confirmedWithDepositCollection1` | keep |
| `bookingNearTypeDays` | `null` | change to `7` |
| `bookingNearType` | `confirmedWithDepositCollection1` | change to `confirmedWithDepositCollection2` so <=7-day arrivals pay 100% immediately |
| `dailyPriceStrategy` | `allowLower` | keep only if Daily Prices remain in use |
| `dailyPriceType` | `default` | keep only if Daily Prices remain in use |
| `allowGuestCancellation` | `daysBeforeArrival: 365` | change to `daysBeforeArrival: 30` |
| `depositPayment1` | 50% | keep |
| `depositPayment2` | 100% | keep |
| `depositNonPayment` | `cancel` | keep for the payment middleware V1 model |

Active Daily Price Rule on `621440`:

| Field | Current value |
| --- | --- |
| Rule id | 1 |
| Name | `Daily Price` |
| Price for | up to 2 people |
| Extra person | ZAR 300 |
| Extra child | ZAR 300 |
| Minimum stay | 1 |
| Maximum stay | 365 |
| Offer | 1 |
| Booking page | direct and agent enabled |
| Channels | many OTA/channel flags enabled |

Calendar Daily Price values:

| Room | Current sampled daily price |
| --- | --- |
| `621440` | `price1 = 1800` across sampled dates through 2026-12-31 |
| `678122` | `price1 = 2400` across sampled dates through 2026-12-31 |

Active Fixed Prices on `621440`:

| Fixed Price | Current behavior |
| --- | --- |
| `Weekday Check-In` (`5982310`) | Direct/agent booking enabled. Check-in Monday-Friday. Allowed nights all days. Check-out all days. 3-night minimum. 365-night maximum. 1-day minimum advance. Booking type `default`, so it inherits property `confirmedWithDepositCollection1`. ZAR 1800 for 1 or 2 people, ZAR 300 extra person, ZAR 2400 room price for max occupancy. |
| `Request for Weekend Check-In` (`6320921`) | Direct/agent booking disabled. Check-in Saturday-Sunday. Allowed nights all days. Check-out all days. 4-night minimum. 365-night maximum. 3-day minimum advance. Booking type `requestWithManualConfirmation`. Same price values as weekday fixed price. |

The current Fixed Price price amounts are correct. The rule windows are not: weekday check-ins allow too-short notice, weekend check-ins need a 2-14 day request/manual window plus a 15+ day deposit-confirmed window, and the 4-night weekend minimum no longer matches the clarified 3-night minimum.

## API offer probes

The live `/inventory/rooms/offers` probes show that the Daily Price is currently driving direct offers for short stays:

| Probe | Result |
| --- | --- |
| `621440`, 2 adults, 2026-06-24 to 2026-06-25 | Offer returned at ZAR 1800 |
| `621440`, 2 adults, 2026-06-24 to 2026-06-26 | Offer returned at ZAR 3600 |
| `621440`, 2 adults, 2026-06-24 to 2026-06-27 | Offer returned at ZAR 5400 |
| `621440`, 3 adults, 2026-06-24 to 2026-06-27 | Offer returned at ZAR 6300 |
| `621440`, 4 adults, 2026-06-24 to 2026-06-27 | Offer returned at ZAR 7200 |
| `621440`, 2 adults, 2026-06-27 to 2026-06-30 | Offer returned at ZAR 5400 |
| `621440`, 2 adults, 2026-06-27 to 2026-07-01 | Offer returned at ZAR 7200 |

The 1-night and 2-night offers are the problem. They should not be available if the intended weekday minimum is 3 nights. The likely cause is the active Daily Price Rule with `minimumStay = 1` and direct booking enabled. Beds24 documents that Fixed Price rules do not affect Daily Prices, so the Fixed Price 3-night minimum does not protect itineraries priced by the Daily Price.

There is a second related issue: the weekend Fixed Price is request-only but is currently not direct/agent visible, and it covers the wrong advance window. If the Daily Price Rule is disabled without replacing the weekend structure, weekend direct behavior may disappear or remain wrong. The intended correction is therefore three-part: stop the Daily Price from bypassing the rules, create a 2-14 day weekend request/manual price, and create a 15+ day weekend deposit-confirmed price.

## How Daily Prices and Fixed Prices interact

Beds24 has two price systems:

- Daily Prices: rules are defined under Daily Price Rules; actual values are entered in the Calendar/Daily Prices rows.
- Fixed Prices: date-range prices with their own conditions, such as min/max nights, allowed days, check-in days, booking type, direct booking visibility, and channel visibility.

Key interaction rules:

- Beds24 says Daily Prices are recommended for seasonal/dynamic pricing and many channel setups.
- Beds24 says Fixed Prices are useful when prices are fixed ahead, have few seasons, or when enquiries should be allowed if no price is found.
- A combination can be used, but Daily Prices can override/fine-tune Fixed Prices for individual dates.
- Rules in Fixed Prices have no effect on Daily Prices.
- When both are active, `dailyPriceStrategy` controls whether Daily Prices can be undercut by Fixed Prices. The current property value is `allowLower`.
- By default, Beds24 tends to offer the lowest price that matches the guest selection, unless price strategies prevent this.
- If multiple Fixed Prices match, Beds24 normally offers the lowest matching price unless a Fixed Price strategy blocks lower/shorter alternatives.

For Newlands, this means:

- The current Daily Price row can make stays available even where the Fixed Price rules would not.
- The current Daily Price Rule has no way, through the API schema, to express "weekday instant-booking but weekend request-only" as cleanly as the two Fixed Prices do.
- The current Fixed Prices encode the business rule more precisely than the Daily Price Rule.

## How channel eligibility works

Beds24 channel price output is controlled at the price level:

- Daily Prices: channel/direct visibility is controlled under the Daily Price Rule `bookingPage` and `channels` enable settings.
- Fixed Prices: channel/direct visibility is controlled under the Fixed Price `bookingPage` and `channels` settings.
- Channel Manager output depends on each channel's pricing model.

Beds24's channel pricing docs distinguish:

- Occupancy pricing: multiple occupancy prices can be sent. With Fixed Prices, 1-person, 2-person, and room price can send, but extra-person/extra-child prices often do not send as separate values.
- Occupancy and length-of-stay pricing: a price for each occupancy and different stay lengths can be sent on capable channels.
- Per-day pricing: only one price per date can send. If multiple prices are active, channels may receive the lowest-minimum-stay price or the highest-occupancy price depending on the channel model.

This matters because Newlands currently uses:

- 1-person price: ZAR 1800
- 2-person price: ZAR 1800
- extra-person price: ZAR 300
- room/max-occupancy price: ZAR 2400

For channels that do not send extra-person prices, the room/max-occupancy price or explicit occupancy prices matter more than the extra-person field. For Google specifically, Beds24 says the 2-person price is compulsory.

## Google Vacation Rentals requirements

Beds24-specific Google behavior:

- Beds24 can distribute direct prices and inventory to Google.
- Google for Vacation Rentals is for vacation rental properties such as apartments and holiday houses.
- Google creates the vacation rental listing from pictures, prices, availability, and descriptions sent by Beds24.
- Beds24 sends the lowest 2-person price from Offer 1 and Offer 2 from direct booking prices.
- A 2-person price is compulsory; if no 2-person price is supplied, the room sends as unavailable.
- Beds24 can also send prices for 1, 3, 4, 6, and 8 guests if defined.
- Fixed Price discounts do not send to Google.
- Guests clicking from Google open the Beds24 booking page; redirecting elsewhere is not supported.
- Beds24 recommends a strong landing page with property name/logo, at least one high-quality room picture, contact details, address, and map.

Google's own requirements:

- Google Vacation Rentals needs listing information, pricing data, and a landing page.
- Accurate rates and availability must match the landing/booking page to maintain price accuracy.
- Price shown on Google must match the price for the selected occupancy and selected check-in/check-out dates.
- Google expects the user to be able to complete booking at the displayed price and receive a confirmed booking within 24 hours.
- Double occupancy is the default/base price pattern; if only single-occupancy prices are sent, the property may not display except for single-occupancy searches.
- Google Vacation Rentals currently supports an advance booking window up to 330 days and length of stay up to 30 days.
- For Vacation Rentals ARI, each unit is a separate listing with exactly one room of one room type.
- Room sharing is not supported; Google supports full-property vacation rental listings.
- Vacation rental listing markup requires maximum occupancy, stable identifier, at least 8 photos, latitude/longitude, and name. Google recommends property type and full address.

## What Google needs to display vacation rental prices

Beds24/Google requirements that matter for Newlands:

1. Google product must be set to Google for Vacation Rentals in `(SETTINGS) CHANNEL MANAGER > GOOGLE ADS`.
2. Google can list either the property or room content. Beds24 says Google Vacation Rentals listings are per property and only one room per property can connect.
3. The selected listing needs enough content:
   - at least 8 pictures in Beds24;
   - property name;
   - city, state, postcode, address, country;
   - latitude and longitude matching the real location;
   - useful descriptions/amenities.
4. The selected room must have `Synchronise = Notify` so Google can verify content.
5. Beds24 must have direct-booking prices and availability for the searched itinerary.
6. A 2-person price is compulsory. Beds24 says if no 2-person price is supplied, the room sends as unavailable.
7. The price sent to Google is the lowest 2-person price from Offer 1 and Offer 2 from direct booking prices.
8. The Beds24 booking page is the landing/booking page. Redirecting guests somewhere else is not supported.
9. The Google-visible price must match the price shown on the Beds24 booking page for the same dates and occupancy.
10. Google's own price policy says the displayed price must be accurate and bookable online, and the booking must result in confirmation within 24 hours.

This explains why a Daily Price may have been added intentionally. A Daily Price with a direct 2-person price gives Beds24 a clean Google-feedable price row even when a Fixed Price is not directly bookable or has request-only/other constraints.

The risk is that Beds24 does not document a separate "show price to Google but do not allow direct booking" mode on the Google page. It says Google uses direct booking prices. Therefore, if the Daily Price is visible as a direct booking price, Google can use it, but direct guests may also be able to use it unless the booking page/channel settings prevent that.

## Request-only pricing and Google

I did not find Beds24 or Google documentation saying Google Vacation Rentals supports a "request price" that is intentionally not bookable online.

What the docs do say:

- Beds24: Google displays live prices and availability, and the guest can then book directly on the Beds24 booking page.
- Beds24: guests coming from Google will be shown the Google price and expect to pay the same price on the booking page.
- Google: prices must be accurate and bookable online for the selected itinerary; the transaction must result in a confirmed booking within 24 hours.

So the conservative interpretation is:

- Google should receive prices only for itineraries Newlands is willing to let a guest complete online at that price.
- Request-only weekend stays may be problematic for Google unless Beds24 has an internal Google-specific handling path that still satisfies Google's "bookable/confirmed within 24 hours" policy.
- The current setup may have been trying to solve this by giving Google a Direct/Daily Price for price display while using Fixed Prices for the normal booking-page behavior. That pattern needs live confirmation in Beds24's Google preview/mapping and on the booking page before changing it.

## Implications for Newlands

Google eligibility shape:

- Newlands is structurally a good fit for Google Vacation Rentals: one full self-catering cottage, one physical unit, direct booking page, address, geolocation, and max occupancy 4.
- The duplicate room record is risky for Google. Google expects one unit/listing for the bookable property. Sending both `621440` and `678122` as independent listings would misrepresent one cottage as two.
- Google requires at least 8 photos for vacation-rental structured data and Beds24 says minimum 8 pictures for Google Vacation Rentals. The API currently returns no assigned pictures, but the supplied Google landing page renders 16 image references, so picture assignment should be verified in the control panel rather than assumed missing.

Pricing risks:

- The active Daily Price Rule currently exposes 1-night and 2-night offers through the API. This may be intentional for Google coverage, but it conflicts with the intended Fixed Price minimum-stay rules if those offers are actually bookable by direct guests.
- If Google reads "direct booking prices" and sees the Daily Price path, it may cache/display itineraries that the business does not want to sell unless the Daily Price is deliberately constrained.
- Weekend request-only pricing should be visible to direct guests as a request flow, but should not be assumed safe for Google until the Google mapping/landing-page flow proves it is either excluded from Google or accepted as compliant.
- Google defaults many searches to 1 night and short near-term stays. If Newlands enforces a 3-night minimum, some Google visibility will be naturally limited.
- Current Fixed Prices extend to 2027-10-23, but Google only needs/caches up to roughly 330 days ahead.

## Recommended target pricing model

For direct booking and Google readiness, do not remove the Daily Price bypass until we verify whether it is required for Google. Treat the Fixed Prices as the business-rule source of truth, and treat the Daily Price as a possible Google/feed compatibility layer.

Target:

1. Keep `Weekday Check-In` as the instant-bookable direct price:
   - direct/agent booking enabled;
   - check-in Monday-Friday;
   - allowed nights all days;
   - check-out all days;
   - min nights 3;
   - min advance 2;
   - booking type `default` inheriting deposit collection;
   - 2-person price ZAR 1800;
   - room/max occupancy price ZAR 2400.
2. Add or modify a near-term weekend request price:
   - booking type `requestWithManualConfirmation`;
   - check-in Saturday-Sunday;
   - allowed nights all days;
   - check-out all days;
   - min nights 3;
   - min advance 2;
   - max advance 14;
   - direct/agent request visibility enabled if direct weekend requests should be accepted.
3. Add or modify a standard weekend deposit-confirmed price:
   - booking type `default`;
   - check-in Saturday-Sunday;
   - allowed nights all days;
   - check-out all days;
   - min nights 3;
   - min advance 15;
   - max advance 365;
   - direct/agent booking enabled;
   - keep Google disabled or unlaunched until a tested path proves request-only prices are excluded from Google or accurately handled by Google.
4. Investigate the Google channel UI before changing the Daily Price Rule:
   - Google product selected;
   - whether Google is using property or room listing mode;
   - which room is set to `Synchronise = Notify`;
   - View Mapping Data;
   - Google landing page preview;
   - whether Google receives Daily Prices, Fixed Prices, or both.
5. If the Daily Price is required for Google:
   - keep a 2-person Daily Price available for Google/direct price feed;
   - constrain it so it does not create unwanted 1-night/2-night, too-short-notice, or near-term weekend confirmed direct bookings;
   - document exactly whether it is Google-only, direct-booking visible, or channel-visible.
6. If the Daily Price is not required for Google, disable it for direct booking/channels or remove calendar `price1` values so it cannot bypass the Fixed Price rules.
7. Keep a 2-person price defined for Google. Without it, Beds24 says Google will mark the room unavailable.
8. Keep the max occupancy room price defined for channels that cannot use extra-person pricing.
9. Do not enable `678122` for Google or direct booking.

Alternative if we later want Daily Prices:

- Create separate Daily Price Rules for the intended price cases and use calendar values as the primary pricing model.
- Recreate the weekday/weekend min-stay behavior with Daily Price Rules and calendar restrictions.
- Confirm whether daily price booking type can meet the weekend request-only requirement in the control panel. The API schema exposes property-level `dailyPriceType`, but not a per-day/per-rule booking type equivalent to the Fixed Price `bookingType`.
- Re-run offer probes and Beds24 Price Check before enabling Google.

Given the current requirements, the Fixed Price model is less ambiguous for business rules, but the Daily Price may be necessary for Google price visibility. We should verify before changing it.

## Verification checklist before Google

Use Beds24 Price Check plus API offers:

- 2 adults, Monday-Friday check-in, 1 night: no bookable offer.
- 2 adults, Monday-Friday check-in, 2 nights: no bookable offer.
- 2 adults, Monday-Friday check-in, 3 nights: ZAR 5400, deposit-confirmed.
- 4 guests, Monday-Friday check-in, 3 nights: ZAR 7200, deposit-confirmed.
- 2 adults, weekday check-in 2-7 days out, 3 nights: full-payment confirmed flow.
- 2 adults, Saturday/Sunday check-in 2-14 days out, 3 nights: request-only or excluded from Google, not instant-confirmed.
- 2 adults, Saturday/Sunday check-in 15+ days out, 3 nights: deposit-confirmed.
- `678122`: not visible/bookable as a second direct listing.
- Google/landing page: one canonical room/listing, at least 8 assigned photos, max occupancy 4, address/geocode, room description, amenities, cancellation policy, direct-booking language.
- Google price accuracy: the price Google can see must be the same price shown on the Beds24 booking page for the selected dates and occupancy.

## Sources

- Beds24 Google Hotel Ads & Google for Vacation Rentals: https://wiki.beds24.com/index.php/Google_Hotel_Ads
- Beds24 Prices overview: https://wiki.beds24.com/index.php/Category:Prices
- Beds24 Daily Prices: https://wiki.beds24.com/index.php/Category:Daily_Prices
- Beds24 Fixed Prices: https://wiki.beds24.com/index.php/Category:Fixed_Prices
- Beds24 Setting Prices for Booking Channels: https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels
- Beds24 Weekend and Weekday Prices: https://wiki.beds24.com/index.php/Weekend_and_Weekday_Prices
- Beds24 initial setup: https://wiki.beds24.com/index.php/Do_the_initial_Setup
- Google Vacation Rentals onboarding: https://developers.google.com/hotels/vacation-rentals/dev-guide/onboarding
- Google Price Accuracy Policy: https://support.google.com/hotelprices/answer/6064419
- Google troubleshooting missing/incomplete pricing: https://support.google.com/hotelprices/answer/11190438
- Google Vacation Rental structured data: https://developers.google.com/search/docs/appearance/structured-data/vacation-rental
