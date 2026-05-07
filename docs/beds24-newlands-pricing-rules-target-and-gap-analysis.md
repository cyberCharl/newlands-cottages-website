# Beds24 Newlands pricing and booking-rule gap analysis

Date: 2026-05-07

This document translates the clarified Newlands Cottages commercial rules into a Beds24 configuration shape, then compares that target against the live read-only Beds24 API state. No Beds24 write calls were made.

## Target business rules

### Unit model

| Rule | Target |
| --- | --- |
| Physical inventory | One self-catering cottage only |
| Sellable unit | One canonical Beds24 room for Clarkia Cottage |
| Capacity | Maximum 4 guests |
| Duplicate room records | Should not create a second sellable unit |
| Turnover gap | Do not allow a guest checkout and another guest checkin on the same date |

### Pricing

The pricing model is flat and occupancy-based:

| Occupancy | Nightly price |
| --- | ---: |
| 1 guest | ZAR 1800 |
| 2 guests | ZAR 1800 |
| 3 guests | ZAR 2100 |
| 4 guests | ZAR 2400 |

Beds24 encoding:

| Beds24 field | Target value |
| --- | --- |
| `1PersonPrice` | `1800`, enabled |
| `2PersonPrice` | `1800`, enabled |
| `extraPersonPrice` | `300`, enabled |
| `roomPrice` | `2400`, enabled |
| `roomPriceGuests` | `0`, meaning max capacity |

This is enough to produce:

| Guest count | Calculation | Result |
| --- | --- | ---: |
| 1 | explicit 1-person price | ZAR 1800 |
| 2 | explicit 2-person price | ZAR 1800 |
| 3 | 2-person price + 1 extra person | ZAR 2100 |
| 4 | 2-person price + 2 extra people, matching room price | ZAR 2400 |

### Booking rules

| Rule | Target |
| --- | --- |
| Minimum stay | 3 nights |
| Weekday minimum booking notice | 2 days before checkin |
| Weekend minimum booking notice | 2 days before checkin, but request/manual below 15 days |
| Same-day turnover | Block at least 1 day after checkout |
| Standard payment | 50% deposit secures dates |
| Short-term payment | Bookings with arrival in 7 days or less pay 100% immediately |
| Balance | Balance due 7 days before arrival |
| Cancellation 8-30 days before arrival | Forfeit 100% of the deposit |
| Cancellation 0-7 days before arrival | Forfeit 100% of the booking total |
| Guest self-cancellation | V1 recommendation: allow self-cancellation only until 30 days before arrival, then handle penalty-window cancellations manually |
| Weekend advance rule | Saturday/Sunday checkins more than 14 days out are deposit-confirmed; Saturday/Sunday checkins 2-14 days out are request/manual confirmation |

The weekend rule implies three sellable booking cases:

| Case | Checkin days | Advance window | Booking type | Payment |
| --- | --- | --- | --- | --- |
| Near-term weekday | Monday-Friday | 2-7 days | Confirmed with Deposit Collection 2 via near-term booking rule | 100% immediate payment |
| Standard weekday | Monday-Friday | 8-365 days | Confirmed with Deposit Collection 1 | 50% deposit |
| Near-term weekend | Saturday-Sunday | 2-14 days | Request with manual confirmation | Manual confirmation and payment handling |
| Standard weekend | Saturday-Sunday | 15-365 days | Confirmed with Deposit Collection 1 | 50% deposit |

## Relevant Beds24 model

### Fixed Prices fit the business rules

Beds24 Fixed Prices support date ranges plus minimum nights, minimum/maximum advance, allowed nights, checkin days, checkout days, booking type overrides, direct booking visibility, and channel visibility. Beds24's weekend/weekday documentation says that if different weekday/weekend conditions are required, two Fixed Prices are the appropriate Fixed Price pattern.

Sources:

- https://wiki.beds24.com/index.php/Category:Fixed_Prices
- https://wiki.beds24.com/index.php/Weekend_and_Weekday_Prices
- https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay

### Daily Prices are useful for channels but can bypass Fixed Price rules

Beds24 documents that Daily Prices and Fixed Prices can be combined, but "Rules in Fixed Prices have no effect on Daily Prices." Daily Prices also have their own booking page/channel enablement. This means a Daily Price with `minimumStay = 1` can create offers even when the Fixed Price minimum is 3 nights.

Sources:

- https://wiki.beds24.com/index.php/Category:Daily_Prices
- https://wiki.beds24.com/index.php/Category:Prices

### Occupancy pricing is simple in Beds24

Beds24's occupancy-pricing documentation maps this exact kind of setup to either:

- Fixed Prices with single/double/extra-person prices; or
- Daily Prices with a price for up to 2 people and an extra-person price.

For channel output, Beds24 warns that some channel models cannot send Fixed Price extra-person values. Fixed Prices can send 1-person, 2-person, and room/max-occupancy prices; Daily Prices can send extra-person pricing on channels that support occupancy pricing.

Sources:

- https://wiki.beds24.com/index.php/Occupancy_Based_Prices
- https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels

### Deposit collection supports normal and near-term variants

Beds24 Deposit Collection provides Deposit Collection 1 and Deposit Collection 2, and booking rules can apply different rules for normal, near-term, and exceptional-period bookings. The API exposes:

| API field | Use |
| --- | --- |
| `bookingRules.bookingType` | Standard direct booking type |
| `bookingRules.bookingNearTypeDays` | Defines the near-term arrival window |
| `bookingRules.bookingNearType` | Booking type for near-term arrivals |
| `paymentCollection.depositPayment1` | Deposit Collection 1 amount |
| `paymentCollection.depositPayment2` | Deposit Collection 2 amount |

Sources:

- https://wiki.beds24.com/index.php/Deposit_Collection
- https://wiki.beds24.com/index.php/Setting/propertiesconfirmtype

### No back-to-back turnover should use room blocking

The API exposes room-level `blockAfterCheckOutDays`. Beds24 documentation describes "Block Dates after Check-out" as the setting for blocking days between departure and next arrival, and notes it is suitable for quantity-one rooms. Clarkia Cottage has quantity 1, so this is the right primitive for the no same-day-turnover rule.

Sources:

- https://wiki.beds24.com/index.php/Managing_Business_Disruptions
- Beds24 API V2 schema: https://beds24.com/api/v2/apiV2.yaml

## Google Vacation Rentals constraints

The current Google settings screenshot confirms:

| Setting | Current screenshot value |
| --- | --- |
| Google product | Google for Vacations Rentals (List Property) |
| Property id | `297420` |
| Room `621440` | `Synchronise = Notify` |
| Room `678122` | `Synchronise = Disable` |
| Price multiplier | `100%` |
| Landing page | `https://beds24.com/booking.php?propid=297420&sr1-best=1&apisource=58&referer=googlehpa` |

This is directionally right: Google should see one property listing and the canonical room only.

Beds24's Google page says:

- Google Vacation Rentals listings are created from pictures, prices, availability, and descriptions sent from Beds24.
- Google displays live prices and availability if the property meets the guest search criteria.
- The guest books on the Beds24 booking page; redirecting somewhere else is not supported.
- The price sent to Google is the lowest 2-person price from Offer 1 and Offer 2 from direct booking prices.
- A 2-person price is compulsory; otherwise the room sends as unavailable.
- Prices for 1, 3, 4, 6, and 8 guests are also sent if defined.
- Guests coming from Google expect to pay the same price on the booking page.

Sources:

- https://wiki.beds24.com/index.php/Google_Hotel_Ads
- https://developers.google.com/hotels/vacation-rentals/dev-guide/onboarding
- https://support.google.com/hotelprices/answer/6064419

There is still no documented Beds24/Google mode that means "show a request-only price to Google, but do not let the guest book at that price." The conservative interpretation remains:

- Google-visible prices should be prices Newlands is willing to honour on the Beds24 booking page.
- Near-term weekend request-only stays are probably not a clean Google price candidate unless Beds24 excludes request-only prices from the Google feed or Google accepts the specific request flow.
- The current Daily Price may have been added as a Google feed compatibility layer, but it currently also creates direct API offers for stays shorter than Newlands wants to sell.

## Current live Beds24 state

Read-only API snapshot: `/tmp/beds24-newlands-pricing-20260507200727`

### Property booking and payment rules

| Field | Current value | Target | Status |
| --- | --- | --- | --- |
| `bookingRules.bookingType` | `confirmedWithDepositCollection1` | `confirmedWithDepositCollection1` | OK |
| `bookingRules.bookingNearTypeDays` | `null` | `7` | Gap |
| `bookingRules.bookingNearType` | `confirmedWithDepositCollection1` | `confirmedWithDepositCollection2` | Gap |
| `paymentCollection.depositPayment1` | 50% | 50% | OK |
| `paymentCollection.depositPayment2` | 100% | 100% | OK |
| `paymentCollection.depositNonPayment` | `cancel` | `cancel`, assuming payment middleware handles retries cleanly | OK |
| `allowGuestCancellation.daysBeforeArrivalValue` | `365` | `30` | Gap |
| `bookingCutOffHour` | `0` | Not the main turnover control; min advance already blocks bookings made too late | OK if min advance is fixed |

### Canonical room `621440`

| Field | Current value | Target | Status |
| --- | --- | --- | --- |
| `qty` | `1` | `1` | OK |
| `maxPeople` | 4 in full API snapshot | 4 | OK |
| `minStay` | `1` | Either `3` globally, or keep `1` only if all prices/Daily Prices enforce `3` | Gap because Daily Price does not enforce it |
| `restrictionStrategy` | `stayThrough` | `stayThrough` | OK |
| `blockAfterCheckOutDays` | `0` | `1` | Gap |
| Offer 1 | enabled always, default booking type | enabled always | OK |

### Active Daily Price Rule on `621440`

| Field | Current value | Target | Status |
| --- | --- | --- | --- |
| Name | `Daily Price` | If kept, rename to describe purpose | Needs cleanup |
| Price for | Up to 2 people | Up to 2 people | OK |
| Extra person | ZAR 300 | ZAR 300 | OK |
| Minimum stay | `1` | `3` unless deliberately Google-only and not direct-bookable | Gap |
| Min days until checkin | `0` | `3` unless deliberately Google-only and not direct-bookable | Gap |
| Booking page direct | `true` | Only if it follows Newlands direct rules | Gap |
| Channels | Many enabled | Only intended channels | Needs cleanup |

Calendar values sampled for 2026-06-24 to 2026-07-01:

| Room | Daily price row |
| --- | --- |
| `621440` | `price1 = 1800`, `minStay = 1`, `maxStay = 365`, `numAvail = 1` |
| `678122` | `price1 = 2400`, `minStay = 7`, `maxStay = 365`, `numAvail = 1` |

### Fixed Prices on `621440`

| Fixed Price | Current | Target | Status |
| --- | --- | --- | --- |
| `Weekday Check-In` | Mon-Fri checkin, min 3 nights, min advance 1, direct enabled, booking type default, correct occupancy pricing | Mon-Fri checkin, min 3 nights, min advance 3, direct enabled, booking type default | Mostly OK, min advance too short |
| `Request for Weekend Check-In` | Sat-Sun checkin, min 4 nights, min advance 3, max advance 365, request/manual booking type, direct disabled, correct occupancy pricing | Sat-Sun checkin, min 3 nights, min advance 2, max advance 14, request/manual booking type, direct visible if it should accept direct requests | Needs redesign |
| Missing standard weekend price | None | Sat-Sun checkin, min 3 nights, min advance 15, max advance 365, booking type default | Gap |

The current Fixed Price occupancy values match the simplified pricing scheme:

| Field | Current value |
| --- | --- |
| `1PersonPrice` | 1800 enabled |
| `2PersonPrice` | 1800 enabled |
| `extraPersonPrice` | 300 enabled |
| `roomPrice` | 2400 enabled |
| `roomPriceGuests` | 0, max capacity |

### Live offer probes

Using the read-only `/inventory/rooms/offers` endpoint for room `621440`:

| Probe | Current result |
| --- | --- |
| 2026-06-24 to 2026-06-25, 2 adults | Offer returned at ZAR 1800 |
| 2026-06-24 to 2026-06-26, 2 adults | Offer returned at ZAR 3600 |
| 2026-06-24 to 2026-06-27, 2 adults | Offer returned at ZAR 5400 |
| 2026-06-24 to 2026-06-27, 3 adults | Offer returned at ZAR 6300 |
| 2026-06-24 to 2026-06-27, 4 adults | Offer returned at ZAR 7200 |
| 2026-06-27 to 2026-06-30, 2 adults | Offer returned at ZAR 5400 |
| 2026-06-27 to 2026-07-01, 2 adults | Offer returned at ZAR 7200 |

The price math is correct. The availability/rule behavior is not: the 1-night and 2-night offers should not exist under the clarified Newlands rules. A 3-night Saturday checkin less than 15 days out should be request/manual. A 3-night Saturday checkin 15 or more days out can be deposit-confirmed.

### Google landing page observation

The supplied landing page URL resolves:

`https://beds24.com/booking.php?propid=297420&sr1-best=1&apisource=58&referer=googlehpa`

The page source currently shows:

- Newlands Cottages / `2-Bedroom Cottage | Clarkia Cottage`
- an `Enquire` action, not a clear instant-book action in the text scrape
- 16 image references, so the visible landing page appears to satisfy the 8-picture minimum even though API `includePictures=true` returned `null`
- the displayed policy text still says:
  - `50% deposit to secure booking`
  - `100% refund up to 30 days before booking`
  - `Full payment due 14 days prior to booking`

This landing-page behavior supports the hypothesis that the Google URL may be using a request/enquiry flow while a separate Daily Price supplies Google-visible pricing. But the API offer probes prove that the Daily Price also exposes short-stay offers unless hidden or constrained elsewhere.

## Recommended target Beds24 configuration

### Property-level booking/payment rules

Draft target:

```json
{
  "bookingRules": {
    "bookingType": "confirmedWithDepositCollection1",
    "bookingNearTypeDays": 7,
    "bookingNearType": "confirmedWithDepositCollection2",
    "allowGuestCancellation": {
      "type": "daysBeforeArrival",
      "daysBeforeArrivalValue": 30
    },
    "bookingCutOffHour": 0
  },
  "paymentCollection": {
    "depositNonPayment": "cancel",
    "depositPayment1": {
      "fixedAmount": 0,
      "variableAmount": {
        "type": "percentage",
        "percentageValue": 50
      }
    },
    "depositPayment2": {
      "fixedAmount": 0,
      "variableAmount": {
        "type": "percentage",
        "percentageValue": 100
      }
    }
  }
}
```

The ordinary balance collection needs an operational trigger. The current target says the balance is due 7 days before arrival, so implement the balance request as an Auto Action/payment request rather than a rate calculation.

If guests should be able to self-cancel inside the 30-day penalty window, set `allowGuestCancellation.type = always` instead and handle forfeiture/refunds manually. For V1, the safer setting is `daysBeforeArrival: 30`, so self-service cancellation only covers the no-penalty window.

### Room-level setup

Draft target for room `621440`:

```json
{
  "id": 621440,
  "qty": 1,
  "maxPeople": 4,
  "blockAfterCheckOutDays": 1,
  "restrictionStrategy": "stayThrough"
}
```

For room-level `minStay`, there are two valid strategies:

| Strategy | Use when | Tradeoff |
| --- | --- | --- |
| Set room `minStay = 3` | All channels and all price models should enforce 3 nights globally | Stronger protection; harder to create exceptions later |
| Keep room `minStay = 1` and enforce `3` on every active price/Daily Price | We need future exceptions or a Google/channel workaround | More flexible; easier to accidentally bypass with Daily Prices |

Given the clarified rules, `minStay = 3` is the safer target unless Beds24/Google testing proves the Daily Price workaround needs room-level flexibility.

### Fixed Price structure

Use three Fixed Prices, all on room `621440`, all with the same occupancy pricing:

| Price | Checkin days | Min nights | Min advance | Max advance | Booking type | Direct booking |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `Weekday Check-In 2-365 Days` | Mon-Fri | 3 | 2 | 365 | `default` | enabled |
| `Weekend Check-In Request 2-14 Days` | Sat-Sun | 3 | 2 | 14 | `requestWithManualConfirmation` | enabled for direct requests; Google safety still needs testing |
| `Weekend Check-In 15+ Days` | Sat-Sun | 3 | 15 | 365 | `default` | enabled |

Use:

```json
{
  "roomPrice": 2400,
  "roomPriceEnable": true,
  "roomPriceGuests": 0,
  "1PersonPrice": 1800,
  "1PersonPriceEnable": true,
  "2PersonPrice": 1800,
  "2PersonPriceEnable": true,
  "extraPersonPrice": 300,
  "extraPersonPriceEnable": true,
  "extraChildPriceEnable": false,
  "allowedDays": {
    "mon": true,
    "tue": true,
    "wed": true,
    "thu": true,
    "fri": true,
    "sat": true,
    "sun": true
  },
  "checkOutDays": {
    "mon": true,
    "tue": true,
    "wed": true,
    "thu": true,
    "fri": true,
    "sat": true,
    "sun": true
  },
  "restrictionStrategy": "stayThrough"
}
```

### Daily Price decision

Do not leave the current Daily Price as-is.

There are two possible target paths:

| Path | Configuration | When to choose |
| --- | --- | --- |
| Fixed Prices only | Disable Daily Price direct/channel use or remove `price1` values for room `621440`; rely on the three Fixed Prices | Choose if Google can use the Fixed Price direct prices correctly |
| Constrained Daily Price | Keep a Daily Price only if Google needs it, but set `minimumStay = 3`, `minDaysUntilCheckin = 2`, and restrict direct/channel enablement to the exact intended use | Choose only if Google mapping/preview proves Daily Price is required |

Current Daily Price settings are not acceptable for the clarified rules because they expose 1-night and 2-night offers.

### Google-specific caution

The Google configuration screenshot is mostly correct for structure:

- property-listing product selected;
- canonical room `621440` set to notify;
- duplicate room `678122` disabled;
- 100% multiplier.

Before changing prices, use Beds24's Google channel UI to inspect "View Mapping Data" and test the landing page/preview for these cases:

| Google/search case | Expected safe behavior |
| --- | --- |
| 2 adults, 1 night | No price/availability |
| 2 adults, 2 nights | No price/availability |
| 2 adults, weekday checkin, 3 nights | ZAR 5400, direct confirmed payment flow |
| 4 guests, weekday checkin, 3 nights | ZAR 7200, direct confirmed payment flow |
| 2 adults, Saturday/Sunday checkin 2-14 days out, 3 nights | Request flow or excluded from Google, but not shown as instant bookable |
| 2 adults, Saturday/Sunday checkin 15+ days out, 3 nights | ZAR 5400, direct confirmed payment flow |

## Gap summary

| Area | Current | Required action |
| --- | --- | --- |
| Price math | Correct | Keep values |
| Weekday min advance | 1 day | Change to 2 days |
| Global/price min stay | Daily Price allows 1 night | Enforce 3 nights everywhere |
| Short-term full payment | Disabled because `bookingNearTypeDays = null` | Set near-term days to 7 and near type to Deposit Collection 2 |
| Weekend rule | All weekend fixed price is request/manual but hidden from direct; Daily Price bypasses it | Replace with request/manual weekend 2-14 days and deposit-confirmed weekend 15+ days; constrain/remove Daily Price |
| Same-day turnover | `blockAfterCheckOutDays = 0` | Set canonical room to 1 |
| Guest cancellation | 365 days | Change to 30 days |
| Duplicate room | `678122` still has active Daily Price/direct/channel enablement | Keep disabled for Google and prevent independent direct/channel exposure |
| Google | Correct product and room notify shown; request/direct behavior unproven | Inspect mapping data and preview before write changes |

## Next write-plan draft

When a write-scoped Beds24 token is available, make changes in this order:

1. Change property cancellation and near-term payment rules.
2. Set room `621440` `blockAfterCheckOutDays = 1`.
3. Decide whether room `621440` should have `minStay = 3` globally.
4. Replace current two Fixed Prices with the three Fixed Price structure above, or modify/create as needed while preserving IDs where safe.
5. Disable or constrain Daily Price Rule 1 on `621440`.
6. Disable direct/channel exposure for duplicate room `678122` unless a channel dependency is intentionally retained.
7. Re-run offer probes and Beds24 Price Check.
8. Inspect Google "View Mapping Data" and landing preview before relying on Google traffic.
