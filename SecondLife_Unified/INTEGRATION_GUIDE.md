# SecondLife — unified workplace implementation

## Integration and source provenance

This delivery combines three role-specific workplaces into one React application. The original Figma exports remain in their original directories. Buyer screens and shared controls were adapted from Figma_Make_buyer; the reusable administrative table was adapted from Figma_Make_admin. Inspection showed that Figma_Make_seller contained buyer screens rather than a seller management application. Seller listing, offer and fulfilment screens were therefore implemented for this delivery. Admin screens were connected to the same state rather than retaining the original independent datasets.

The integration is a frontend interaction prototype aligned with the project's business workflows. It does not replace the formal 19-table DBML, implement database migrations, or claim to provide a production Three-Tier Architecture. The planned Android WebView Container can display the responsive web interface; an Android wrapper is not delivered here.

## Shared design specification

| Element | Shared rule |
| --- | --- |
| Primary colour | Emerald #0C6C4F; darker hover #09573F |
| Supporting colour | Emerald #EDF8F3 for selected navigation and supporting panels |
| Surfaces | Slate-50 canvas, white panels, slate-200 borders |
| Text | Slate-900 headings; slate-600 secondary information |
| Typeface | Inter when locally installed, Segoe UI and system sans-serif fallbacks |
| Controls | Consistent primary, secondary, ghost and danger buttons; minimum 44px primary control height |
| Geometry | Rounded cards and inputs; consistent 16–32px section spacing |
| Icons | One shared inline SVG outline icon component; no mixture of unrelated icon libraries |
| Status | Green for success, amber for pending, red for unavailable/error, blue for delivery progression; text always accompanies colour |
| Navigation | Common SecondLife leaf identity, header, role indicator, sidebar and notification entry |
| Responsive layout | Persistent desktop sidebar; collapsible navigation on smaller screens; wrapping actions and horizontally scrollable tables |
| Feedback | Shared alerts, confirmation dialogs, validation messages, toasts, empty states and loading/error previews |
| Accessibility | Named controls, focus outlines, skip link, semantic forms and tables; not a full accessibility certification |

The application explicitly declares a light colour scheme so browser automatic darkening does not change the intended palette. Product visuals are labelled placeholders inherited from the source prototype. They are not real uploaded product photographs.

## Buyer workplace — detailed explanation

The buyer workplace prioritises discovery and purchase. Product cards use a common visual hierarchy: visual placeholder, title, condition, seller and price. Search and category filters help narrow the catalogue, while the wishlist preserves selected products and buyer notes. The visible catalogue uses the same listing records edited by sellers and moderated by administrators. Disabled listings and listings belonging to restricted sellers are removed from normal discovery.

The shopping cart separates active items from saved items and groups purchase lines by seller. A buyer selects the lines to purchase before reviewing an address and a payment summary. Checkout validates selected lines together, including available quantity, current price and offer eligibility. If validation fails, no partial group of seller orders is published. Successful checkout creates a separate order per seller and reserves stock; cart lines remain until successful payment. Payment success removes only cart lines whose revisions still match the purchased versions, preserving later edits.

Offers retain their original expiry time after acceptance. Acceptance itself does not reserve inventory. An accepted offer can be used once and cannot be reused after its order is cancelled. The buyer's offer page reflects the actual decision made in the seller workplace, replacing the source prototype's buyer-operated seller-decision buttons.

Order details distinguish payment status from delivery status. The buyer sees the seller's shipping action, the automatic transit transition and two separate confirmation actions. Confirming delivery changes the delivery record; confirming receipt completes the order. Completed orders allow buyer feedback. Paid orders can be disputed, and administrator decisions and refund information become visible in the buyer workplace.

## Seller workplace — detailed explanation

The seller overview derives its statistics from the current seller's shared listings and transactions. It shows listing count, order count, orders ready to ship and relevant cases. Switching between seller demo accounts changes ownership scope rather than switching to an unrelated dataset.

My listings provides search, status filtering and create/edit forms. Sellers choose an existing catalogue model and enter price, physical quantity, condition, description and minimum offer percentage. The table distinguishes on-hand quantity, reserved quantity and available quantity. Quantity cannot be reduced below existing reservations. Disabled listings require administrator restoration, preserving moderation decisions. Changes are immediately reflected in buyer discovery and checkout validation.

Incoming offers shows the product, buyer, proposed amount, current status and remaining validity. Only the product's owning seller can accept or decline an eligible pending offer. A decision generates a buyer notification and changes the buyer's offer view. Expired offers cannot be accepted.

Orders and Delivery show the same transaction identities and totals as Buyer and Admin. Shipping registration is available only after successful payment and requires courier and tracking details. Marking an order SHIPPED records an event and saves a cooldown deadline. The prototype automatically advances to IN_TRANSIT when the deadline is reached while the application is open, or catches up after reopening. Sellers cannot perform buyer delivery or receipt confirmations. Relevant disputes and notifications remain visible to the seller.

## Admin workplace — detailed explanation

The administrator sees platform-wide records through the same shell and controls. The dashboard calculates counts and paid volume from shared orders; processed refunds reduce the displayed paid volume. User management supports account restriction and restoration. Suspending a seller disables that seller's listings; restoring the account does not silently re-enable moderated listings.

Listing moderation displays physical and reserved stock alongside availability. Disable and Restore affect what buyers can purchase while preserving historical order snapshots. Category maintenance updates the shared catalogue categories, and categories referenced by models cannot be removed. This build reuses existing catalogue models; full model creation and specification editing remain outside the delivered screen set.

Orders & payments and Delivery provide a platform view of buyer/seller transactions, shipping details and tracking events. Reports & disputes displays shared order disputes and supports a recorded resolution. Refund authorisation is separate from simulated payment execution: an administrator first resolves the case with an eligible amount, then processes the authorised refund from the order panel. Duplicate refunds and amounts exceeding the paid order total are rejected.

Settings control the payment timeout, offer validity and shipping cooldown for new transactions. Existing transaction deadlines remain unchanged. Notifications are scoped to the selected account. Administration routes and action handlers check the demo role, but these frontend checks are not a security boundary.

## Canonical module mapping

| Module | Exact authoritative name | Prototype connection |
| --- | --- | --- |
| M1 | User and Account Management | Buyer profile/addresses; demo identities; account restrictions |
| M2 | Product Listing and Inventory Management | Seller listing edits; shared stock and reservations |
| M3 | Product Discovery and Wishlist Management | Buyer catalogue, filtering and wishlist |
| M4 | Shopping Cart and Offer Management | Active/saved cart; seller decisions; one-use offers |
| M5 | Order and Payment Management | Per-seller orders, payment simulation, timeouts, refunds |
| M6 | Review and Dispute Management | Buyer order feedback and order disputes; administrator resolution |
| M7 | Admin and Platform Management | User/listing moderation, categories and settings |
| M8 | Delivery and Transaction Management | Seller shipping, saved cooldown and buyer confirmations |

These names come from ../../references/Module_DFD_process_name.md. The assessed unique features remain M2, M4, M5 and M8.

## Code organisation and data boundaries

- `App.tsx`: shared shell and role-aware workplace navigation.
- `ui.tsx`, `Table.tsx`, `index.css`: common components, SVG icons and design tokens.
- `screens/`: adapted buyer screens; `Workspaces.tsx`: integrated seller/admin screens.
- `domain.ts`: business transitions, invariants and sample state.
- `store.tsx`: React state, ownership filtering, local persistence and notifications.
- `tests/run.cjs`: isolated domain tests, using a temporary compilation directory.

The frontend uses composite view models. For example, an order view combines order items, payment outcome, delivery information and refund details. These objects are not proposed replacement tables. Internal AWAITING_PAYMENT represents the schema's PENDING order state; IN_REVIEW is displayed as UNDER_REVIEW in administrative views. A production API must explicitly map view models to the authoritative schema.

The local state is stored under `secondlife-unified-v1`; the selected account uses sessionStorage. Tabs on the same origin receive storage updates, but simultaneous writers use last-write-wins behaviour. Cloning and publishing a state change provides all-or-nothing behaviour within one running prototype, not database ACID isolation. Real concurrency, authentication, durable audit logs, payment callbacks and timed workers belong in the planned backend. Timer progression is not a background service when all application tabs are closed.

Current scope includes buyer-written order reviews and order disputes. Seller-authored reviews, user/product report submission, full catalogue-model CRUD, file uploads and a production login/registration service are not implemented. Delivery charges are zero in this demo; no additional fee field is introduced into the DBML. No real money moves and no courier integration is called.

## Validation

TypeScript checking and production compilation passed. Twelve domain workflow tests cover multi-seller checkout, rollback, cart revisions, payment retry, timeout/cancellation release, ownership, one-use offers, delivery sequencing, moderation and refunds. Browser checks additionally exercised seller offer acceptance → buyer accepted price → checkout → payment → seller shipping → administrator visibility of the same order. Screenshot examples are provided in `screenshots/`.
