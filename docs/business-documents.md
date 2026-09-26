# Invoices and quotations

The English **Invoices & Quotations** section is available to administrators and staff explicitly granted the `documents` permission. It does not change order balances, supplier accounts or revenue reports.

- Choose Invoice or Quotation, and OMR (three decimal places) or AED (two).
- Enter quantities and unit prices manually. Currency changes do not convert prices.
- JACKETS, seller/buyer and company details come from the supplied QUOTAION.pdf.pdf reference. The source describes BLOZA as seller and Sultan Aljahdhami Projects as buyer; both remain editable.
- Company footer: Sultan Aljahdhami Projects, RN 1595371, Alamirat/Muscat/Oman, GSM 92266597.
- The original stamp and signature are extracted unchanged into src/assets/documents. Every generated document includes them.
- Preview and PDF download use the same renderer. Long item lists continue onto additional pages; company details and page numbers repeat.
- Saved quotations can be copied into a new invoice without overwriting the quotation.

## Persistence and access

Documents are saved in this browser's localStorage, one record per UUID, under `thawb_business_document_v1:`. Clearing site data removes them; other devices/browsers do not share them. This limitation is explicitly displayed in the interface. Download PDF copies for retention. Unsaved editors stay mounted while navigating between sections; leaving/reloading the app triggers an unsaved-changes warning. Saved records use revisions to reject stale writes from another tab and reject duplicate numbers within a document type.

A proposed cloud migration was **not applied**: the existing app uses custom client-side login and anonymous database policies. Adding another anonymously accessible business table was rejected by automatic approval review. No business_documents database table or migration is required by this implementation. Shared cloud storage should be implemented with verified identity and server-enforced document permissions before enabling it.

## Verification

Run `node --test tests/businessDocuments.test.mjs` for currency arithmetic, invalid inputs, persistence, stale edits, duplicate numbering and failed storage writes. Run the existing suite and `npm run build` for integration checks. PDF examples in output/business-documents are synthetic layout samples, not issued financial documents.
