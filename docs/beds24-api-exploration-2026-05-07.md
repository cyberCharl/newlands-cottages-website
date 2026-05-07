# Beds24 API exploration - 2026-05-07

This note records a read-only exploration of the Beds24 account for Newlands Cottages. The invite code was exchanged successfully for an API V2 access token and refresh token, but no token values are stored in this repository and no write calls were made to Beds24.

The temporary token response is held at `/tmp/beds24_tokens.json` on this machine with user-only permissions. Treat it as a secret. The access token expires after 24 hours; the refresh token remains usable if refreshed at least once every 30 days.

## Sources read

- Beds24 API category: https://wiki.beds24.com/index.php/Category:API
- Beds24 API V2 wiki: https://wiki.beds24.com/index.php/API_V2.0
- Beds24 API V2 Swagger schema: https://beds24.com/api/v2/apiV2.yaml
- Booking page overview: https://wiki.beds24.com/index.php/Category:Booking_Page
- Booking page developer options: https://wiki.beds24.com/index.php/Category:Developers
- Embedded iframe guidance: https://wiki.beds24.com/index.php/Embedded_Iframe
- Confirmation messages: https://wiki.beds24.com/index.php/Category:Confirmation_Messages
- Auto Actions: https://wiki.beds24.com/index.php?title=Auto_Actions
- Template variables: https://wiki.beds24.com/index.php?title=Template_Variables
- Terms and conditions: https://wiki.beds24.com/index.php/Terms_and_Conditions
- Booking tracking and return URLs: https://wiki.beds24.com/index.php/Track_Bookings

## Authentication result

The correct token exchange endpoint is:

```text
GET https://beds24.com/api/v2/authentication/setup
Headers:
  accept: application/json
  code: <invite-code>
```

That returned:

- an access token
- a refresh token
- `expiresIn: 86400`

The token diagnostics endpoint reported the token as valid:

```text
GET https://beds24.com/api/v2/authentication/details
```

Refresh flow:

```text
GET https://beds24.com/api/v2/authentication/token
Headers:
  accept: application/json
  refreshToken: <refresh-token>
```

The wiki and Swagger disagree in wording in one place: the wiki FAQ says to exchange the invite code using `POST /authentication/setup`, but the Swagger schema and successful live call use `GET /authentication/setup`.

## API surface that matters here

Beds24 recommends API V2 for new work. The schema currently exposes these useful areas:

- `GET /properties` and `POST /properties`
- `GET /inventory/rooms/availability`
- `GET /inventory/rooms/offers`
- `GET /inventory/rooms/calendar` and `POST /inventory/rooms/calendar`
- `GET /inventory/fixedPrices` and `POST /inventory/fixedPrices`
- `GET /bookings`, `POST /bookings`, and booking invoice/message endpoints
- `GET /channels/settings` and `POST /channels/settings` for selected channels
- `GET /accounts` and `POST /accounts`

Important limits from the docs:

- API credit limits are account-level. The default documented limit is 100 credits per 5 minutes.
- Access tokens from refresh tokens last 24 hours.
- Refresh tokens expire if unused for 30 days.
- API V2 currently cannot upload/send pictures or create webhooks. The property webhook fields can be read in `/properties`, but the wiki says API V2 webhook sending/setup is not currently available.
- `POST /properties` can create/update properties and rooms. For room-level updates, the request must include the parent property id.
- Price rules can be read through `GET /properties?includePriceRules=true`; existing price rules can be modified, but new price rules cannot currently be created through that field.
- Per-date calendar values can be read and set through `/inventory/rooms/calendar`.

## Live account/property snapshot

The API returned one account and one property.

Property:

- Property id: `297420`
- Name: `Newlands Cottages`
- Type: `cottage`
- City/country: Cape Town, ZA
- Currency: ZAR
- Website: `https://www.newlandscottages.co.za/`
- Check-in: 14:00 to 22:00
- Check-out: 10:00
- Payment collection:
  - Deposit payment 1: 50%
  - Deposit payment 2: 100%
  - Non-payment status: `cancel`
- Enabled payment gateways:
  - `customGateway`, priority 4
  - `offlinePayment`, priority 10
- Stripe, card collection, PayPal, and most other gateways are disabled.
- Booking webhook URL is empty.

This lines up with the local payment-middleware direction: Beds24 Custom Gateway is enabled and can be used as the handoff into the Cloudflare/Yoco middleware.

## Room configuration found

Beds24 currently has two room records with the same public name:

### Room `621440`

- Name: `Clarkia Cottage`
- Type: `family`
- Quantity: 1
- Max people: 4
- Max adults: 4
- Max children: 3
- Min stay: 1
- Max stay: 365
- Min price: 1800
- Beds/features include a king en-suite bedroom, two single beds, one full bathroom, and one shower/toilet bathroom.
- Room template 1: `Two bedroom, two bathroom self-catering cottage`
- Room description fields are empty.
- Room pictures returned by API: none.
- Offer 1 is named `Standard Offer`; other offers are mostly empty placeholders.
- Price rule 1 is named `Daily Price`; the other price-rule slots are empty.

### Room `678122`

- Name: `Clarkia Cottage`
- Type: `double`
- Quantity: 1
- Max people: 4
- Max adults: null
- Max children: null
- Min stay: 7
- Max stay: 365
- Min price: 0
- Features are more amenity-style: TV, kitchen, wifi, washer, outdoor dining area, grill, fireplace, bedrooms, bathrooms.
- Room templates are empty.
- Room description fields are empty.
- Room pictures returned by API: none.
- Airbnb channel settings exist for this room, but it is not enabled/published.

This duplication is the biggest setup ambiguity. It looks like one room record is configured for direct booking/pricing, while the other carries more OTA-style content/amenities. Before changing anything, decide whether Beds24 should have one canonical Clarkia room, or two intentionally separate internal room records with dependencies/allocation between them.

## Pricing and availability behavior

`GET /inventory/fixedPrices?propertyId=297420&includeRateCodes=true` returned two fixed prices, both for room `621440`:

1. `Weekday Check-In`
   - first night: 2025-10-23
   - last night: 2027-10-23
   - min nights: 3
   - room price: 2400
   - 1 person: 1800
   - 2 people: 1800
   - extra person: 300
   - check-in allowed Monday-Friday
   - direct booking page enabled

2. `Request for Weekend Check-In`
   - first night: 2025-10-23
   - last night: 2027-10-23
   - min nights: 4
   - room price: 2400
   - 1 person: 1800
   - 2 people: 1800
   - extra person: 300
   - check-in allowed Saturday-Sunday
   - booking type: `requestWithManualConfirmation`
   - direct booking page disabled

Calendar probe for 2026-05-07 to 2026-06-07:

- Room `621440`:
  - unavailable on 2026-05-07
  - available 2026-05-08 to 2026-05-27
  - unavailable 2026-05-28 to 2026-06-07
  - min stay 1
  - price1 1800

- Room `678122`:
  - unavailable on 2026-05-07
  - available 2026-05-08 to 2026-06-07
  - min stay 7
  - price1 2400

Offer probes:

- For 2 adults, 2026-05-08 to 2026-05-11, room `621440` returned Standard Offer at ZAR 5400.
- For 2 adults, 2026-05-09 to 2026-05-13, room `621440` returned Standard Offer at ZAR 7200.
- The property-level offers response included room `678122` but with no offer in these tested cases.

The pricing configuration is probably functional for room `621440`, but the global room setup is confusing because `621440` has fixed prices and direct-bookable offers while `678122` has a 7-night minimum and no returned direct offer in the tested date ranges.

## Property text/content gaps

Follow-up correction: a later `GET /properties` call with `includeTexts=all` returned more text than the first exploration call. Property and room copy are partially populated, but the booking-page-specific description/message fields remain sparse and the useful room content is split across two duplicate room records. The target configuration is documented in `docs/beds24-newlands-target-configuration.md`.

Property `texts.en` currently has:

- Headline: `Clarkia Cottage:  Your private heritage Escape in Newlands, Cape Town`
- Cancellation policy: present
- Property description: populated in the later full-text snapshot
- Booking page description 1: empty
- Booking page description 2: empty
- General/legal policy: minimal, currently `Maximum 4 guest accommodation.`
- Guest details header: not populated in the returned data
- Guest enquiry header: not populated in the returned data
- Confirm booking button message: not populated in the returned data
- No-room/no-price messages: not populated in the returned data

Both room records have API-returned room text/content fields in the later full-text snapshot. Room `621440` carries the better booking-page display and offer text, while room `678122` carries a shorter duplicate description and more amenity-style feature codes.

The local website already has strong copy and image assets. A good next step is to map the website copy into Beds24's property and room text fields:

- property headline
- property description
- booking page description 1 and 2
- location description/directions
- house rules/general policy
- cancellation policy
- room display name/accommodation type
- room description/content description
- guest details header
- payment instructions
- no availability/no price messages

With a write-scoped token, most of this can likely be updated through `POST /properties`.

## Email templates and guest messages

Beds24 has three distinct concepts that are easy to conflate:

1. Property/room templates
   - These are exposed by API V2 as `templates.template1` through `templates.template8`.
   - They are not full email templates; they are reusable text fields addressable with template variables like `[PROPERTYTEMPLATE1]` and `[ROOMTEMPLATE1]`.

2. Direct booking confirmation messages
   - Configured in `(SETTINGS) GUEST MANAGEMENT > CONFIRMATION MESSAGES`.
   - The docs say these are automatically sent for bookings from the Beds24 booking page.
   - They can include template variables like `[PROPERTYCANCELPOLICY]`, `[PROPERTYTEMPLATE1]`, `[ROOMTEMPLATE1]`, and `[CANCELURL]`.
   - I did not find an API V2 endpoint that exposes the full confirmation-message first/last parts or subject configuration.

3. Auto Actions
   - Configured in `(SETTINGS) GUEST MANAGEMENT > AUTO ACTIONS`.
   - They can send email, channel messages, SMS, add info codes, update bookings, and trigger HTTP notifications.
   - The API V2 schema does not expose an Auto Actions CRUD endpoint.

Live property templates:

- Property template 1 contains the cancellation policy text.
- Property templates 2-8 are empty.
- Room `621440` template 1 contains `Two bedroom, two bathroom self-catering cottage`.
- Room `678122` templates are empty.

Conclusion: I can audit and draft the email/Auto Action content, and I can populate supporting property/room template variables if a write-scoped token is created. I cannot fully create or customize Beds24 confirmation-message or Auto Action email templates through the current API V2 surface I found. Those likely need control-panel work.

## Booking page customization

Beds24 booking page customization is split across API-exposed content and control-panel-only design/developer settings.

API-exposed or partially API-exposed:

- Property and room names/types
- Booking rules
- Payment collection settings
- Payment gateways enable/priority
- Guest booking questions and custom question labels
- Property/room text content
- Property/room template variables
- Webhook fields shown on the property object, though API V2 docs say webhook setup/sending is not currently available
- Inventory/calendar/prices/offers

Control-panel/developer setup:

- Booking page layout choice
- Custom CSS
- External CSS file parameter
- JavaScript snippets
- Custom fixed text
- Booking widgets
- Embedded iframe generator
- Booking return URL
- Confirmation messages
- Auto Actions

Useful public booking page URL patterns:

```text
https://beds24.com/booking2.php?propid=297420
https://beds24.com/booking2.php?roomid=621440
https://beds24.com/booking2.php?propid=297420&checkin=2026-05-08&numnight=3&numadult=2
https://beds24.com/booking2.php?checkin=2026-05-08&numnight=3&numadult=2&br1-621440=Book&roomid=621440
```

The Beds24 iframe docs recommend opening the booking page in a new tab instead of embedding it where possible, because iframe date/session behavior and mobile display can be problematic. If embedding is required, the docs provide a parameter-forwarding script using a `data-src` iframe.

For this Astro website, a robust approach is probably:

- keep the main site as the polished brochure experience;
- use the Beds24 booking page for availability/checkout, opened with prefilled URL parameters;
- avoid iframe embedding unless there is a strong reason;
- if we need a first-class on-site date picker, use API V2 to query offers/availability server-side and then hand off to the Beds24 booking URL.

## What I can do with the current read-only token

- Keep auditing account/property/room/channel/inventory setup.
- Compare Beds24 content against the Astro website content and produce exact field-by-field proposed copy.
- Generate draft `POST /properties` and `POST /inventory/fixedPrices` payloads for human review.
- Probe availability/offers for date ranges and occupancy combinations.
- Verify booking-page URL behavior and build website links/widgets around the correct `propid`, `roomid`, `checkin`, `numnight`, and `numadult` parameters.
- Support the local payment middleware by verifying booking and invoice data with `GET /bookings`.

## What I can do if you create a write-scoped token

With explicit approval and a write-scoped invite, I should be able to update:

- property details and contact/display metadata via `POST /properties`
- room setup and room content via `POST /properties`
- booking questions and custom question labels via `POST /properties`
- booking rules and payment collection settings via `POST /properties`
- payment gateway enable/priority fields where API accepts them
- fixed prices via `POST /inventory/fixedPrices`
- calendar prices/min-stay/availability through `POST /inventory/rooms/calendar`
- selected channel settings through `POST /channels/settings`

I would not start with broad writes. The safer path is:

1. Export the current JSON snapshot.
2. Draft minimal JSON patches for one area at a time.
3. Review the patch against the Swagger schema.
4. Apply to a single property/room.
5. Re-read the API and test the booking page.

## Likely setup issues to address first

1. Decide why there are two Clarkia Cottage room records and which one should be canonical for direct bookings.
2. Populate Beds24 property and room descriptions. The public booking page currently has almost no descriptive API-returned copy even though the website has good content.
3. Add or link pictures in Beds24 manually, since API V2 cannot upload pictures at present.
4. Align fixed-price and direct booking behavior:
   - room `621440` appears to be the current direct-bookable room;
   - weekend fixed price is request-only and not exposed to the direct booking page;
   - room `678122` is available in calendar but did not return direct offers in probes.
5. Review guest booking questions. The current form asks for many optional address/company fields and requires mobile/country. That may be fine, but it is worth trimming for conversion.
6. Configure direct booking confirmation messages in the Beds24 control panel and use template variables fed by property/room template fields.
7. Use the Booking Return URL and/or Custom Gateway configuration to integrate with this site's payment success/cancel/failure pages.
8. Keep API polling low and cache public availability if building website widgets. Beds24 explicitly warns against high-frequency public real-time API use.

## Suggested next work package

Create a Beds24 content map from the website:

- website source field
- Beds24 target field
- proposed text
- whether API-writeable
- whether control-panel-only

Then apply the low-risk content updates first:

- property description
- booking page description 1/2
- room display/content descriptions
- guest details/payment helper text
- policy text cleanup

After that, test booking URLs and only then adjust room/pricing structure.
