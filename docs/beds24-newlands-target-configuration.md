# Beds24 target configuration for Newlands Cottages

Last reviewed: 2026-05-07

This document defines the working target for Newlands Cottages in Beds24. It is based on the current read-only API snapshot, the Newlands Cottages website copy, and the Beds24 documentation listed below. No Beds24 write calls have been made.

Related audit note: [beds24-api-exploration-2026-05-07.md](./beds24-api-exploration-2026-05-07.md)

## Goal

Newlands Cottages offers one physical, self-catering cottage: Clarkia Cottage. Beds24 should therefore be configured around one canonical rentable room type with quantity 1. Property, room, pricing, and booking rules should all reinforce that model.

The current duplicate room records should not be treated as two sellable rooms. They may have been created for VRBO, Google pricing, OTA testing, or another channel experiment, but that is out of scope for this pass. For now the target is:

- consolidate the useful content from both room records into one canonical room record;
- make only that canonical room visible and bookable for direct bookings;
- leave the duplicate room record untouched or hidden until channel history/dependencies have been checked;
- avoid room-dependency/channel-shadow setup unless a future channel requirement proves it is needed.

## Beds24 model to keep straight

Beds24 separates the configuration into layers:

- Property: identity, contact details, check-in/out times, booking rules, deposit collection, payment gateways, property-level texts and policies.
- Room type: the sellable accommodation type. For Newlands this should represent the whole cottage, not an individual bedroom.
- Unit: the physical unit under a room type. Newlands should have one unit.
- Offer: the guest-facing offer/rate option. Offer 1 is the standard offer.
- Price rules and fixed prices: rate logic, occupancy pricing, check-in/check-out rules, min/max nights, and whether a rate is used on the direct booking page and/or channels.
- Calendar values: per-date availability, min/max stay, overrides, and daily prices.
- Room dependencies: a deliberate mechanism for selling one physical space under multiple room layouts/channel models. This is not configured at present and should not be introduced for the direct-booking cleanup.

Important Beds24 rules from the docs:

- Room dependencies are for deliberate multi-layout/shared-inventory setups and must be tested carefully because duplicate channel exposure can create overbooking risk.
- Fixed Prices are appropriate for bounded date ranges with conditions such as check-in day, min nights, booking type, and channel/direct booking visibility.
- Daily Prices are recommended by Beds24 for seasonal pricing, many price options, and dynamic pricing. Fixed Prices can still be fine for a simple direct-booking model.
- Minimum stay can be set at room, offer, price, and calendar levels. The room minimum is the lowest allowed value and cannot be reduced by other settings.
- Restriction strategy `stayThrough` means min/max stay rules must be satisfied for each booked night where the price applies. This is the safer default for Newlands.
- A Fixed Price can override booking type, so a weekend rate can be request-only while the property default remains deposit-confirmed.
- Deposit collection requires a payment gateway. If non-payment is set to cancelled, dates are not reserved until payment completes, which reduces abandoned-booking blocking but leaves a small double-booking window.

## Current Beds24 state

Property:

- `propertyId`: `297420`
- `name`: `Newlands Cottages`
- `propertyType`: `cottage`
- `currency`: `ZAR`
- `address`: `39 Klipper Road, Rondebosch, Cape Town, Western Cape, 7700`
- `web`: `https://www.newlandscottages.co.za/`
- `checkInStart`: `14:00`
- `checkInEnd`: `22:00`
- `checkOutEnd`: `10:00`
- `bookingRules.bookingType`: `confirmedWithDepositCollection1`
- `bookingRules.dailyPriceStrategy`: `allowLower`
- `bookingRules.dailyPriceType`: `default`
- `bookingRules.allowGuestCancellation`: `daysBeforeArrival`, value `365`
- `paymentCollection.depositPayment1`: 50%
- `paymentCollection.depositPayment2`: 100%
- `paymentCollection.depositNonPayment`: `cancel`
- enabled payment gateways: `customGateway` priority 4, `offlinePayment` priority 10

Room records:

- `621440`: `Clarkia Cottage`
  - Current best candidate for the canonical room because it has the active fixed prices and direct-booking offer behavior.
  - `roomType`: `family`
  - `qty`: 1
  - `maxPeople`: 4
  - `maxAdult`: 4
  - `maxChildren`: 3
  - `minStay`: 1
  - `maxStay`: 365
  - `restrictionStrategy`: `stayThrough`
  - Has bedroom/bathroom feature codes.
  - Has the stronger display name and offer description.
  - Has all active fixed prices.

- `678122`: `Clarkia Cottage`
  - Current duplicate/shadow candidate.
  - `roomType`: `double`
  - `qty`: 1
  - `maxPeople`: 4
  - `maxAdult`: null
  - `maxChildren`: null
  - `minStay`: 7
  - `maxStay`: 365
  - `restrictionStrategy`: `stayThrough`
  - Has the useful amenity feature codes: TV, kitchen, WiFi, washer, outdoor dining area, grill, fireplace, two bedroom markers, two bathroom markers.
  - Has some room description content but no active fixed prices.

Dependencies:

- Neither room currently depends on the other.
- Neither room includes bookings from the other.
- Both rooms assign bookings to `thisRoom`.
- Price linking is not configured.

That means these are currently independent room records, not a safe shared-inventory/dependency setup.

## Target property configuration

Keep:

- `name`: `Newlands Cottages`
- `propertyType`: `cottage`
- `currency`: `ZAR`
- `checkInStart`: `14:00`
- `checkInEnd`: `22:00`
- `checkOutEnd`: `10:00`
- `offerType`: `perRoom`
- `roomChargeDisplay`: `onePerBooking`
- `paymentCollection.depositPayment1`: 50%
- `paymentCollection.depositPayment2`: 100%
- `paymentCollection.depositNonPayment`: `cancel`, assuming the custom gateway/Yoco round trip is reliable enough.
- `paymentGateways.customGateway`: enabled, priority 4.
- `paymentGateways.offlinePayment`: enabled only if bank transfer/manual payment should remain an allowed fallback.

Review/change:

- `bookingRules.allowGuestCancellation.daysBeforeArrivalValue`: change from `365` to `30`. The intended self-cancellation window is 30 days.
- `bookingRules.bookingCutOffHour`: currently `0`. Decide whether same-day bookings should be allowed. If not, set a clearer cut-off rule in Beds24.
- `bookingRules.bookingExceptionalType`: current blackout period is `2009-01-01` to `2009-01-01`, effectively inert. Leave it alone unless an actual exceptional blackout period is needed.
- Cancellation refunds through Yoco should be treated as a later payment-middleware V2 feature. The Beds24 configuration target for V1 is policy clarity and correct guest cancellation eligibility, not automatic refund orchestration.

Property text targets:

| Beds24 field | Target value |
| --- | --- |
| `headline` | `Clarkia Cottage: your private heritage escape in Newlands, Cape Town` |
| `propertyDescription` | Use the long-form property story: Newlands Cottages is a heritage self-catering cottage in Rondebosch/Newlands, restored for comfort while preserving its character, with reliable WiFi, a fireplace, equipped kitchen, front garden, and back patio. |
| `propertyDescriptionBookingPage1` | Add a concise direct-booking intro: `Clarkia Cottage is a private two-bedroom, two-bathroom self-catering cottage in leafy Newlands/Rondebosch, Cape Town. It sleeps up to four guests and combines heritage character with practical modern comforts.` |
| `propertyDescriptionBookingPage2` | Add location and use-case copy: `The cottage is close to Table Mountain trails, Kirstenbosch, UCT, the city centre, the V&A Waterfront, and the southern beaches. It is suited to guests who want a quiet, independent base in the Southern Suburbs.` |
| `locationDescription` | Keep the full address. Add a short note that the cottage is in Rondebosch/Newlands below Table Mountain. |
| `directions` | Keep, but rewrite into shorter airport directions or a link-style paragraph. The current turn-by-turn copy is functional but too long for a booking page. |
| `generalPolicy` | Expand from `Maximum 4 guest accommodation.` to a concise policy block once house rules are confirmed. Known minimum: maximum 4 guests. |
| `cancellationPolicy` | Align all policy fields to one wording: `A 50% deposit secures the booking. The balance is due 7 days before arrival. Cancellations within 7 days of arrival forfeit 100% of the booking total. Cancellations within 30 days of arrival and more than 7 days before arrival forfeit 100% of the deposit.` Verify whether cancellations more than 30 days before arrival are fully refundable before publishing. |
| `guestDetailsHeader` | `Please enter the guest details for your stay at Clarkia Cottage.` |
| `guestEnquiryHeader` | `Send Newlands Cottages your enquiry and preferred dates.` |
| `confirmBookingButtonMessage` | `Continue to secure payment.` |
| `roomNotAvailableMessage` | `Clarkia Cottage is not available for the selected dates. Please choose another date range or contact us.` |
| `roomNoPriceMessage` | `We could not calculate an instant price for these dates. Please adjust your dates or send an enquiry.` |
| `noRoomsAvailableMessage` | `Clarkia Cottage is not available for the selected dates.` |

## Target room configuration

Canonical room:

- Use room `621440` as the canonical Clarkia Cottage room unless a hidden channel dependency is discovered outside the API snapshot.
- Keep `qty`: 1.
- Keep `maxPeople`: 4.
- Keep `maxAdult`: 4.
- Keep `maxChildren`: 3 if at least one adult should always be required. If no adult/child distinction is needed, set `maxChildren` to null and simplify guest questions.
- Keep `minStay`: 1 at room level because Beds24 room minimum cannot be reduced by prices/calendar. Enforce operational minimums at the Fixed Price level instead.
- Keep `maxStay`: 365 unless there is an operational reason to cap long stays.
- Keep `restrictionStrategy`: `stayThrough`.
- Preferred `roomType`: `holidayHome`, because the sellable item is a whole cottage. Conservative fallback: keep `family` if any connected channel mapping depends on it.
- Keep one standard offer: Offer 1, name `Standard Offer`, enabled `always`.
- Disable/ignore offers 2-16 unless we intentionally add a refundable/non-refundable/package offer later.

Canonical room text:

| Beds24 field | Target value |
| --- | --- |
| `displayName` | `Clarkia Cottage` or `2-Bedroom Cottage | Clarkia Cottage` if the booking page benefits from the extra clarity. |
| `accommodationType` | `Self-catering cottage` if free text is accepted. If Beds24 expects a controlled value, use the nearest whole-home/cottage value available in the control panel. |
| `roomDescription` | Consolidate the website room copy: `Clarkia Cottage is a beautifully restored two-bedroom heritage cottage for up to four guests. The main bedroom has a king-size bed and full en-suite bathroom. The second bedroom has two single beds and access to a shower-only bathroom. The open-plan living area has a combustion wood fireplace, smart TV, reliable WiFi, and inverter-backed lights and internet. The kitchen includes a two-ring gas hob, convection/microwave oven, air fryer, fridge/freezer, Nespresso machine, kettle, and toaster. Outside there is a small front garden, a private back patio with Weber braai, a washing machine, and dedicated verge parking for one vehicle.` |
| `contentHeadline` | `Two-bedroom, two-bathroom self-catering cottage` |
| `contentDescription` | `A private heritage cottage in Newlands with a king bedroom, twin bedroom, two bathrooms, equipped kitchen, fireplace, WiFi, patio, braai, and parking for one vehicle.` |
| `offerDescription1` | Replace the current large-font HTML with clean copy matching the room description. Avoid inline font-size markup. |
| `template1` | `Two-bedroom, two-bathroom self-catering cottage` |

Feature code consolidation:

- Keep the room `621440` bedroom/bathroom feature codes:
  - king en-suite bedroom
  - second bedroom with two single beds
  - full bathroom
  - shower/toilet bathroom
- Add the useful amenity codes currently only on room `678122`:
  - TV
  - kitchen
  - WiFi
  - washer
  - outdoor dining area
  - grill/braai
  - fireplace
  - fire extinguisher

Pictures:

- The API returned no room/property pictures. Beds24 docs say booking-page pictures are managed under `BOOKING ENGINE > PICTURES`.
- Upload/assign images manually in Beds24. Use consistent landscape images. Assign pictures to the canonical room and Offer 1.
- Suggested first set from the website: front garden, front entrance, living room, kitchen, fireplace, main bedroom, second bedroom, en-suite bathroom, separate bathroom, patio/braai.

Duplicate room `678122`:

- Do not delete yet.
- Do not use it for direct booking.
- After confirming it is not needed for VRBO/Google/other channel history, either hide it or leave it as an internal inactive record.
- It should not have independent availability exposed to guests while room `621440` is also exposed, because there is only one physical cottage.
- If a future channel requires a duplicate room model, configure explicit dependencies so bookings block the shared physical inventory.

## Target pricing configuration

The clarified pricing intent is:

- Base price: ZAR 1800 per night for one or two guests.
- Additional guests: ZAR 300 per additional person, up to four guests.
- Three guests: ZAR 2100 per night.
- Full-room/max-occupancy price: ZAR 2400 per night.
- Minimum stay: 3 nights.
- Weekday minimum booking notice: 2 days before check-in.
- Short-term arrivals within 7 days: full payment immediately.
- Weekday check-ins: instant booking with deposit collection.
- Saturday/Sunday check-ins: request/manual confirmation if 2-14 days out, instant booking with deposit collection if 15+ days out.
- Same-day turnover is not allowed: block at least one day after checkout.

The current active Fixed Prices are both on room `621440`:

| Fixed Price | Current behavior |
| --- | --- |
| `Weekday Check-In` | Direct booking enabled, check-in Monday-Friday, min 3 nights, min advance 1 day, booking type default, ZAR 1800 for 1/2 guests, ZAR 300 extra person, ZAR 2400 room price. |
| `Request for Weekend Check-In` | Direct booking disabled, check-in Saturday-Sunday, min 4 nights, min advance 3 days, booking type request with manual confirmation, same pricing. |

Recommended target:

1. Keep a Fixed Price model for the direct booking cleanup because the current rules are simple and already represented as Fixed Prices.
2. Consider setting room-level `minStay` to 3 because the rule is now global. If the Daily Price/Google workaround requires flexibility, keep room `minStay` at 1 only if every active price path enforces 3 nights.
3. Change `Weekday Check-In` to min advance 2, keep min nights 3, direct enabled, booking type `default`.
4. Replace the single weekend Fixed Price with two advance-window prices:
   - `Weekend Check-In Request 2-14 Days`: Saturday/Sunday check-in, min nights 3, min advance 2, max advance 14, booking type `requestWithManualConfirmation`, direct request visibility enabled if guests should be able to request directly.
   - `Weekend Check-In 15+ Days`: Saturday/Sunday check-in, min nights 3, min advance 15, max advance 365, booking type `default`, direct enabled.
5. Keep `allowedDays` true for all days on all prices so stays can span weekdays/weekends. Use `checkInDays` to control arrival days.
6. Keep `checkOutDays` true for all days unless operations require no departures on specific days.
7. Keep `restrictionStrategy`: `stayThrough`.
8. Set room `blockAfterCheckOutDays` to 1 on canonical room `621440` to prevent same-day turnover.
9. Keep `dailyPriceStrategy`: `allowLower` only while occupancy-based Daily Prices exist or might be used. The active Daily Price may have been added intentionally for Google price visibility, so do not remove it until the Google channel mapping/landing-page behavior is confirmed.
10. Treat Fixed Prices as the business-rule source of truth and Daily Prices as a possible Google/feed compatibility layer. The final configuration must make clear which price type is allowed to create direct bookings, which price type feeds Google, and which channels each applies to.

Open pricing decisions:

- Are cancellations more than 30 days before arrival fully refundable? This is assumed but not stated in the latest policy wording.
- Should extra child pricing equal extra adult pricing? Current fixed prices have extra child disabled.
- Should channel prices be enabled for all channels on these rates? The API currently shows many channel flags enabled. This should be reviewed before touching OTA/VRBO/Google scope.
- The active Daily Price row currently creates API-visible 1-night and 2-night offers even though the minimum is 3 nights. This may be an intentional Google price-feed workaround, but it must be constrained or removed after Google mapping is confirmed. See [beds24-newlands-pricing-rules-target-and-gap-analysis.md](./beds24-newlands-pricing-rules-target-and-gap-analysis.md).

## Target booking rules and payment behavior

Direct booking default:

- `bookingRules.bookingType`: `confirmedWithDepositCollection1`
- `bookingRules.bookingNearTypeDays`: `7`
- `bookingRules.bookingNearType`: `confirmedWithDepositCollection2`
- `paymentCollection.depositPayment1`: 50%
- `paymentCollection.depositPayment2`: 100%
- `paymentCollection.depositNonPayment`: `cancel`
- `paymentGateways.customGateway`: enabled

This matches the local payment middleware direction: Beds24 Custom Gateway posts the payment request to the site, the site creates a Yoco checkout, then the middleware notifies Beds24 after payment.

Policy alignment needed:

- The visible cancellation policy should match both `texts.cancellationPolicy` and `templates.template1`.
- For V1, keep guest self-cancellation at `allowGuestCancellation.daysBeforeArrivalValue = 30` so guests can self-cancel only before the penalty window. If guests should self-cancel inside penalty windows, change this to `always` and handle forfeiture/refunds manually.
- Use Deposit Collection 2 for arrivals within 7 days so short-term bookings pay the full amount immediately.
- Confirmation emails and balance-payment reminders are mostly control-panel/Auto Action work, not API V2 property setup. They should use the same policy wording and the documented `bookpay.php?bookid=[BOOKID]&g=cg&pay=bookbalance` balance-payment link from the payment middleware notes.

Guest booking questions target:

- Required: title, first name, last name, email, mobile, country.
- Optional: arrival time, comments.
- Hide unless there is a specific operational/legal reason: fax, company, state, address, city, postcode, custom questions.
- Consider making phone optional or hidden if mobile is mandatory.

## Booking page target

The public site should remain the main brochure experience and link to Beds24 for booking:

- Property booking page: `https://beds24.com/booking2.php?propid=297420`
- Canonical room booking page: `https://beds24.com/booking2.php?roomid=621440`

Booking page content and layout:

- Use the responsive booking page.
- Use one-room booking behavior. Since Newlands has one cottage, avoid multi-room booking UI if the control panel allows it.
- Ensure a property or room description appears near the top, especially if the Beds24 page is opened in a new tab.
- Show room/offer pictures, features, policies, availability calendar, and offer select.
- Avoid iframe embedding unless necessary. Beds24's own docs point to mobile/session/date handling issues and provide iframe-specific workarounds.

Control-panel-only or mostly manual:

- Booking page layout modules/template.
- Custom CSS/fonts/colors.
- Picture upload and assignment.
- Booking return URL.
- Confirmation messages.
- Auto Actions.
- Payment gateway button labels/instructions.

## API writeability

With the current read-only token I can continue to audit and draft payloads only.

With a write-scoped token and explicit approval, likely API-writeable through API V2:

- property fields and texts via `POST /properties`;
- room fields, texts, offers, feature codes, templates, and dependencies via `POST /properties`;
- booking questions via `POST /properties`;
- property booking rules and payment collection via `POST /properties`;
- fixed prices via `POST /inventory/fixedPrices`;
- calendar availability/min stay/overrides/daily prices via `POST /inventory/rooms/calendar`.

Use caution:

- API V2 POST requests modify full items/subitems by id. Draft minimal payloads and re-read after every change.
- Do not delete room `678122` through API until channel links, historical bookings, and any owner intent are checked.
- Do not change OTA/channel flags in the same pass as direct-booking cleanup.

## Proposed implementation sequence

1. Confirm business rules:
   - same-day booking policy;
   - whether bank transfer/offline payment should remain available;
   - adult/child distinction.
2. Change `allowGuestCancellation.daysBeforeArrivalValue` from `365` to `30` when a write-scoped token is available.
3. Prepare a write payload for property text and policy cleanup only.
4. Prepare a write payload for canonical room `621440` content/feature consolidation only.
5. Prepare a write payload to hide or disable room `678122` from direct booking without deleting it.
6. Before changing pricing, inspect the Beds24 Google channel UI: Google product, synchronised room, View Mapping Data, landing page preview, and whether Google is receiving Daily Prices, Fixed Prices, or both.
7. Prepare a pricing payload only after confirming whether the Daily Price is required for Google. The payload should preserve Google price visibility if needed while preventing unintended short-stay, too-short-notice, and early-weekend confirmed bookings.
8. Manually upload/assign booking-page pictures in Beds24.
9. Use Beds24 Price Check and API offer probes to verify:
   - 2 adults, weekday arrival, 3 nights returns the expected instant-bookable price;
   - 2 adults, weekday arrival, 1 or 2 nights does not return a bookable offer;
   - 4 guests returns the expected max/extra-person price;
   - weekday arrival 2-7 days out requires full payment;
   - weekend arrival 2-14 days out behaves as request-only or is excluded from Google;
   - weekend arrival 15+ days out behaves as deposit-confirmed;
   - no back-to-back checkout/checkin turnover is possible;
   - room `678122` is not visible/bookable to direct guests.
10. Configure confirmation messages, balance-payment reminders, and booking return URL in the Beds24 control panel.

## Sources

- Beds24 API V2: https://wiki.beds24.com/index.php/API_V2.0
- API V2 schema: https://beds24.com/api/v2/apiV2.yaml
- Room dependencies: https://wiki.beds24.com/index.php/Category:Room_Linking_and_Dependencies
- Fixed Prices: https://wiki.beds24.com/index.php/Category:Fixed_Prices
- Daily Prices: https://wiki.beds24.com/index.php/Category:Daily_Prices
- Minimum Stay and Maximum Stay: https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay
- Restriction strategy: https://wiki.beds24.com/index.php/Setting/roomsrestrictionstrategy
- Booking Rules: https://wiki.beds24.com/index.php/Booking_Rules
- Booking types: https://wiki.beds24.com/index.php/Setting/propertiesconfirmtype
- Deposit Collection: https://wiki.beds24.com/index.php/Deposit_Collection
- Occupancy Based Prices: https://wiki.beds24.com/index.php/Occupancy_Based_Prices
- Setting Prices for Booking Channels: https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels
- Responsive Booking Page: https://wiki.beds24.com/index.php/Responsive_Booking_Page
- Booking return/landing page: https://wiki.beds24.com/index.php/Landing_Page
