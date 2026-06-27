# Intellsales Test Cases

This document defines test cases for the current `sales_management_web` application.
It covers the main dashboards, forms, workflows, localization, and the latest pricelist features.

## Test Setup

- Browser: Chrome / Edge / Firefox
- User role: Administrator (or any role with access to the dashboard)
- Start page: `index.html`
- Verify initial data is loaded from `static/js/dashboard/state/dataStore.js`

---

## 1. Authentication / Access

### TC-001: Login page loads
- Steps:
  1. Open the application.
  2. Verify login page displays email and password fields.
- Expected:
  - Login fields are visible.
  - Login button is visible.

### TC-002: Login redirects to dashboard
- Steps:
  1. Enter valid credentials if required.
  2. Submit login.
- Expected:
  - User is redirected to the dashboard.
  - Sidebar and topbar are visible.

---

## 2. Global Navigation

### TC-003: Sidebar routes open correct views
- Steps:
  1. Click each available sidebar route.
- Expected:
  - `Overview` loads overview panel.
  - `Sales` loads sales page.
  - `Customers` loads customers page.
  - `Invoices` loads invoices page.
  - `Inventory` loads inventory page.
  - `Pricelists` loads pricelist section.
  - `Regions` loads regions page.
  - `Visits` loads visit schedule.
  - `Daily Visits` loads daily visits page.
  - `Reports` loads reports page.
  - `Users` loads user management page.

### TC-004: Hash-based routing works
- Steps:
  1. Manually set the location hash to `#pricelist/pl-1`.
  2. Reload the page.
- Expected:
  - The correct route is displayed and the page renders.

---

## 3. Overview Page

### TC-005: Summary cards display
- Steps:
  1. Open `Overview`.
- Expected:
  - Overview cards and quick actions are present.

### TC-006: Quick action buttons open forms
- Steps:
  1. Click any quick action button.
- Expected:
  - The correct modal appears.

---

## 4. Customers

### TC-007: Add customer
- Steps:
  1. Open `Customers`.
  2. Click `Add customer`.
  3. Fill required fields.
  4. Submit.
- Expected:
  - New customer appears in customers table.

### TC-008: Edit customer
- Steps:
  1. Open `Customers`.
  2. Click edit on an existing customer.
  3. Change a field.
  4. Submit.
- Expected:
  - Updated data appears in the table.

### TC-009: Delete customer
- Steps:
  1. Open `Customers`.
  2. Click delete on a row.
  3. Confirm.
- Expected:
  - The customer is removed.

---

## 5. Sales

### TC-010: Add sale
- Steps:
  1. Open `Sales`.
  2. Click `New sale`.
  3. Enter customer, amount, payment status.
  4. Submit.
- Expected:
  - Sale appears in the sales table.

### TC-011: Edit sale
- Steps:
  1. Click edit for a sale.
  2. Update amount or status.
  3. Submit.
- Expected:
  - Sale row updates.

### TC-012: Delete sale
- Steps:
  1. Click delete for a sale.
  2. Confirm.
- Expected:
  - Sale is removed.

---

## 6. Invoices

### TC-013: New invoice creation
- Steps:
  1. Open `Invoices`.
  2. Click `New invoice`.
  3. Fill invoice fields.
  4. Submit.
- Expected:
  - New invoice appears in invoices table.

### TC-014: View invoice detail
- Steps:
  1. Open an invoice.
- Expected:
  - Invoice detail page loads.
  - Invoice fields are shown.

### TC-015: Edit invoice
- Steps:
  1. Click `Edit` on invoice detail.
  2. Change payment status or totals.
  3. Submit.
- Expected:
  - Invoice updates correctly.

### TC-016: Archive invoice
- Steps:
  1. Click archive in invoice row actions.
  2. Confirm.
- Expected:
  - Invoice status becomes `Archived`.

---

## 7. Inventory

### TC-017: Add product
- Steps:
  1. Open `Inventory`.
  2. Click `Add product`.
  3. Fill required fields.
  4. Submit.
- Expected:
  - Product appears in inventory list.

### TC-018: Edit product
- Steps:
  1. Click edit on a product.
  2. Change name, unit, or status.
  3. Submit.
- Expected:
  - Product row updates.

### TC-019: Archive product
- Steps:
  1. Click archive on a product row.
  2. Confirm.
- Expected:
  - Product status becomes `Archived`.

---

## 8. Pricelists

### TC-020: View pricelist list
- Steps:
  1. Open `Pricelists`.
- Expected:
  - All pricelists display with counts.

### TC-021: Add pricelist
- Steps:
  1. Click `Add pricelist`.
  2. Fill name, description, status, created by.
  3. Submit.
- Expected:
  - New pricelist appears in list.

### TC-022: Edit pricelist
- Steps:
  1. Click edit on a pricelist.
  2. Change name or status.
  3. Submit.
- Expected:
  - Pricelist updates.

### TC-023: Archive pricelist
- Steps:
  1. Click archive on a pricelist row.
  2. Confirm.
- Expected:
  - Pricelist status becomes `Archived`.
  - Pricelist is not deleted.

### TC-024: Navigate to pricelist detail
- Steps:
  1. Click a pricelist name.
- Expected:
  - Pricelist detail view loads.
  - The page shows `Products by pricelist`.

---

## 9. Pricelist Detail / Product Prices

### TC-025: Add product to pricelist from detail page
- Steps:
  1. Open a pricelist detail page.
  2. Click `Add product` in the `Products by pricelist` section.
  3. Verify modal opens with the current pricelist preselected.
  4. Enter product name and price.
  5. Submit.
- Expected:
  - New price entry appears in the product table.

### TC-026: Edit priced product
- Steps:
  1. Click edit action on a priced product row.
  2. Change the product name or price.
  3. Submit.
- Expected:
  - Row updates with edited values.

### TC-027: Delete priced product
- Steps:
  1. Click delete action on a priced product row.
  2. Confirm deletion.
- Expected:
  - The price line is removed from the list.

### TC-028: Add product button label
- Steps:
  1. Open a pricelist detail page.
- Expected:
  - The button label reads `Add product`.

---

## 10. Regions

### TC-029: Add region
- Steps:
  1. Open `Regions`.
  2. Click `Add region`.
  3. Fill fields.
  4. Submit.
- Expected:
  - New region appears.

### TC-030: Edit region
- Steps:
  1. Edit an existing region.
  2. Change status or name.
  3. Submit.
- Expected:
  - Region row updates.

### TC-031: Delete region
- Steps:
  1. Delete a region.
  2. Confirm.
- Expected:
  - Region disappears from list.

---

## 11. Visits

### TC-032: Create visit schedule
- Steps:
  1. Open `Visits`.
  2. Click `Add visit`.
  3. Fill visit start date, status, user, created by.
  4. Submit.
- Expected:
  - Visit appears in schedule list.

### TC-033: Edit visit schedule
- Steps:
  1. Click edit on a visit.
  2. Modify status or date.
  3. Submit.
- Expected:
  - Visit row updates.

### TC-034: Archive visit
- Steps:
  1. Click archive on a visit row.
  2. Confirm.
- Expected:
  - Visit status becomes `Archived`.

---

## 12. Daily Visits

### TC-035: Add daily visit
- Steps:
  1. Open `Daily Visits`.
  2. Click `Add daily visit`.
  3. Fill date, time, status, notes, customer, user, region.
  4. Submit.
- Expected:
  - Daily visit appears.

### TC-036: Edit daily visit
- Steps:
  1. Edit a daily visit entry.
  2. Change status or notes.
  3. Submit.
- Expected:
  - Entry updates.

### TC-037: Delete daily visit
- Steps:
  1. Delete a daily visit.
  2. Confirm.
- Expected:
  - Entry is removed.

---

## 13. Users

### TC-038: Add user
- Steps:
  1. Open `Users`.
  2. Click `Add user`.
  3. Fill name, email, password, phone, role, status.
  4. Submit.
- Expected:
  - New user appears.

### TC-039: Edit user
- Steps:
  1. Click edit on user row.
  2. Update role or status.
  3. Submit.
- Expected:
  - User record updates.

### TC-040: Delete user
- Steps:
  1. Click delete on a user.
  2. Confirm.
- Expected:
  - User is removed.

---

## 14. Reports

### TC-041: Reports page loads
- Steps:
  1. Open `Reports`.
- Expected:
  - Reports content is displayed.

### TC-042: Reports page navigation works
- Steps:
  1. Click available report links or filters (if present).
- Expected:
  - Page content updates without errors.

---

## 15. Form Validation and Modals

### TC-043: Modal close works
- Steps:
  1. Open any add/edit modal.
  2. Click cancel or close.
- Expected:
  - Modal closes and the page remains.

### TC-044: Required fields enforce data entry
- Steps:
  1. Open a form modal.
  2. Submit with missing required fields.
- Expected:
  - Form should not submit or should highlight missing values.

### TC-045: Read-only fields appear for edit states where expected
- Steps:
  1. Open `Edit` modal for an entity.
- Expected:
  - Read-only fields (ID, created_at, invoice number) are not editable.

---

## 16. Search and Filtering

### TC-046: Table filter works
- Steps:
  1. Enter text in a table search field.
- Expected:
  - Table rows filter to matching entries.

---

## 17. Localization / Language Switching

### TC-047: Language switch persists
- Steps:
  1. Click locale switcher to Arabic.
  2. Verify label text changes.
  3. Switch back to English.
- Expected:
  - UI strings update accordingly.

---

## 18. Data Integrity

### TC-048: Data store updates reflect across views
- Steps:
  1. Create a new entity in one section.
  2. Navigate to a related section.
- Expected:
  - Data is present consistently in both views.

### TC-049: Archiving does not delete records
- Steps:
  1. Archive a pricelist.
- Expected:
  - The pricelist remains in the table, but its status changes to `Archived`.

---

## 19. Regression / Edge Cases

### TC-050: Add product without a pricelist blocked
- Steps:
  1. Open price item modal with no pricelist available.
- Expected:
  - A message shows that a pricelist is required.

### TC-051: Invalid route fallback
- Steps:
  1. Set the URL hash to an unsupported route.
- Expected:
  - The app falls back to a valid page.

### TC-052: Modal open from detail page with required preselection
- Steps:
  1. Open a pricelist detail page.
  2. Click `Add product`.
- Expected:
  - Modal opens and the `Pricelist` selector is prefilled with the current list.

---

## Notes

- These test cases are written for manual verification and can be converted into automated UI tests later.
- The current app is mostly client-side and stateful; refresh behavior should preserve default data from `dataStore.js`.
- New features such as pricelist item edit and pricelist archive should be added to regression test coverage.
