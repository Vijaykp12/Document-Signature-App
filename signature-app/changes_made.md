# Changes Made

This document details all structural, configuration, and interface modifications made to establish correct connections and functionality in the Document Signature application.

---

## 1. Configurations & Database Layer

- **[NEW] Backend Environment Configuration**
  - Created [backend/.env](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/.env) to store key environment variables for local operation.
  - Set `DATABASE_URL=sqlite:///./docsign.db` to instantiate a local SQLite database file, avoiding PostgreSQL setup requirements.
  - Initialized `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `FRONTEND_URL`, and dummy `RESEND_API_KEY`.

- **[MODIFY] Database Signature Schema**
  - Updated [backend/models/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/models/signature.py) to declare coordinate columns `x` and `y` as `Float` instead of `Integer`.
  - Stored values as decimals (0 to 1) representing the fraction of the PDF viewport dimension, resolving the problem where coordinates were rounded to integers `0` or `1`.

---

## 2. Backend Logic & Router Fixes

- **[MODIFY] Audit Logs Service**
  - Adjusted [backend/services/audit_service.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/audit_service.py) to import the `AuditLog` model from the correct module file (`models.audit_logs` instead of `models.audit_log`).
  - Removed standard default argument dependencies to allow direct execution when called.

- **[MODIFY] Documents Router**
  - Modified [backend/routers/documents.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/documents.py):
    - Added missing imports: `Request` (from `fastapi`) and `create_audit_log` (from `services.audit_service`).
    - Fixed Parameter Order: Reordered function signatures for `upload_document`, `delete_document`, `generate_signed_document`, and `create_signing_link` so that parameters without default values (`request: Request` and `document_id`) are declared before defaults.
    - User Database Lookup: Queries the `User` object using `current_user` email string in all endpoints logging audits to retrieve `user.id`.
    - Fixed reference variables in `delete_document` where `document.id` was passed after deleting the database entry. Replaced with `document_id`.
    - Local variable resolution: Moved the assignment of `frontend_url = os.getenv("FRONTEND_URL")` to occur before construct of `signing_url`.
    - Corrected route decorator path `public-document/preview/{token}` to begin with a leading slash `/`.

- **[MODIFY] Signatures Router**
  - Modified [backend/routers/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/signature.py):
    - Added missing imports: `Request`, `SigningLink` (from `models.signing_link`), and `datetime`.
    - Injected `request: Request` parameter into the signature of `public_sign`.
    - Reordered parameters so that non-default parameters (`request`) are declared before dependencies (`db: Session = Depends(get_db)`).
    - Fixed audit logs logic inside `public_sign` by referencing the parameter `link.document_id` instead of undeclared variable `document.id`.

- **[MODIFY] Audit Logs Router**
  - Modified [backend/routers/audit_logs.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/audit_logs.py):
    - Fixed the typo `APIRounter()` to the correct FastAPI instance class `APIRouter()`.
    - Imported `AuditLog` from `models.audit_logs`.
    - Reordered route parameters to place `request` first.

- **[MODIFY] Backend CORS Middleware settings**
  - Updated [backend/main.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/main.py) to add `http://127.0.0.1:3000` to the `allow_origins` array. This ensures that frontend local loopback URL fetches are allowed under security policies.

---

## 3. Frontend logic & Client REST Connections

- **[MODIFY] API Client Helpers**
  - Rewrote [frontend/signature-app-frontend/lib/api.ts](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/lib/api.ts):
    - Replaced the hardcoded URL with dynamic lookup `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`.
    - Explicitly typed all return payloads and client functions (like `mySignatures()`, `uploadDocument()`, etc.) to clear TypeScript `unknown` warnings.
    - Added the `publicSign` guest signature endpoint caller.
    - Added the `getAuditLogs` trace endpoint caller.

---

## 4. Frontend User Interface Correctness

- **[MODIFY] PDF Preview Component**
  - Updated [frontend/signature-app-frontend/app/dashboard/documents/components/PDFPreview.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/components/PDFPreview.tsx):
    - Fixed the compiler error on `signs.data` by validating `signs.success` check beforehand.
    - Supported dynamic `BASE_URL` settings.

- **[MODIFY] Document Display Card**
  - Modified [frontend/signature-app-frontend/app/dashboard/documents/components/Cards/DocumentCard.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/components/Cards/DocumentCard.tsx):
    - Implemented a graphical placeholder state rendering an icon "NO THUMBNAIL" when `document.thumbnail` evaluates to null, instead of drawing a broken browser image link.
    - Aligned image width (`w-full` instead of `w-[250px]`) within the card boundaries to prevent visual clipping.

- **[MODIFY] Menu Options Dropdown**
  - Overhauled styles in [frontend/signature-app-frontend/app/dashboard/documents/components/Cards/DropDownBar.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/components/Cards/DropDownBar.tsx):
    - Redesigned from standard white lists to high-contrast slate buttons (`bg-[#0b132b] border border-cyan-500/20`).
    - Changed semantic button typography color from alert-red (`text-red-600`) to cyan hover state (`hover:text-cyan-400`) for standard neutral actions (Download & Share Link). Only the "Delete" action remains highlighted in alert-red.

---

## 5. Standalone Custom Flow Pages

- **[NEW] Public Landing Signature Route**
  - Built [frontend/signature-app-frontend/app/sign/[token]/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/sign/[token]/page.tsx) to act as the main link target.
  - Supports loading document previews and metadata without authentication.
  - Incorporates interactive click-to-place sign boxes, visual drag adjustments, and submits guest signature data.

- **[NEW] Audit Logs Page**
  - Created [frontend/signature-app-frontend/app/dashboard/audit-logs/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/audit-logs/page.tsx).
  - Fetches and displays recent security/operational trace files (Uploaded Document, Generated Signed Document, etc.) inside a premium data table.

- **[MODIFY] Dashboard Layout Navbar Integration**
  - Integrated a new navigation link "Audit Logs" to [frontend/signature-app-frontend/app/dashboard/layout.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/layout.tsx).

- **[MODIFY] Login & Register Navigation Link Toggles**
  - Integrated navigation links between [login/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/(auth)/login/page.tsx) and [register/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/(auth)/register/page.tsx). Added "Don't have an account? Sign Up" and "Already have an account? Log In" link toggles to resolve route lockouts for new databases.

- **[MODIFY] Resilient Guest Email Dispatch**
  - Wrapped `send_signing_email` in a `try-except` block inside `backend/routers/documents.py`. This ensures that an invalid or unconfigured `RESEND_API_KEY` (standard for local testing) will log a warning but not crash the endpoint, allowing links to be generated.

- **[MODIFY] Unwrapped Dynamic Page Parameters**
  - Updated [page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/public/[token]/page.tsx) to resolve `params` dynamically via the React `use()` hook, satisfying Next.js 15+ routing API specifications.

- **[MODIFY] Redundant Public Preview Layout Cleanup**
  - Updated the dynamic route [page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/public/[token]/page.tsx) to remove the large document thumbnail image from the left details panel. Replaced it with a metadata information card, eliminating the layout issue of two duplicate copies of the PDF rendering side-by-side.

- **[MODIFY] Dashboard Height & Layout Overflows**
  - Updated [page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/page.tsx) to remove the fixed container height `h-[calc(100vh-80px)]` and changed the top margin wrapper from `mt-60` to `mt-8`. This allows the dashboard cards container to expand dynamically and fit all documents naturally.
  - Modified [globals.css](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/globals.css) to set the default theme background variable to dark (`#020617`), which prevents white background strips from being exposed during scroll/overflow.

---

## 6. Day 11: Signature Status Flow & Rejection Handling

- **[MODIFY] Database Schema Migration**
  - Added `status` (String, default `"pending"`) and `rejection_reason` (String, nullable) to `SigningLinks` database schema in [backend/models/signing_link.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/models/signing_link.py).
  - Executed migration commands to add new columns to the active local SQLite database table without losing existing user/document data.

- **[MODIFY] Backend Routing Rejection Flow**
  - Updated `/public-sign/{token}` in [backend/routers/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/signature.py) to set link status to `"signed"`.
  - Added `POST /public-reject/{token}` to [backend/routers/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/signature.py) to receive the rejection reason, mark `is_used = True`, set status to `"rejected"`, and write a detailed audit log trace.
  - Added `GET /signing-links` to [backend/routers/documents.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/documents.py) to fetch all generated signature links belonging to the logged-in owner's documents.
  - Modified `/public-document/preview/{token}` and `/public-document/pdf/{token}` in [backend/routers/documents.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/documents.py) to allow read-only preview of document details and PDFs after they are signed or rejected (removing the strict unused-only block).

- **[MODIFY] Frontend API Client Helpers**
  - Updated [frontend/signature-app-frontend/lib/api.ts](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/lib/api.ts) to declare `status` and `rejection_reason` in the guest preview payload, and added wrapper functions `publicReject` and `getSigningLinks`.

- **[MODIFY] Public Guest Signing Interface**
  - Overhauled [frontend/signature-app-frontend/app/sign/[token]/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/sign/[token]/page.tsx):
    - Created an alert-red "Reject Request" button next to "Finalize Signature".
    - Added a custom modal prompting the user for the rejection reason.
    - Integrated conditional layout checks: if a request has already been signed or rejected, the signer is direct-routed to the corresponding screen displaying historical statuses or rejection reasons.

- **[NEW] Signature Requests Tracker Portal**
  - Created [frontend/signature-app-frontend/app/dashboard/signature-requests/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/signature-requests/page.tsx) to act as a central monitor.
  - Implemented badge overlays (Pending, Signed, Rejected) matching the theme, rejection reason displays, and instant clipboard copying actions.
  - Added the Requests route link to the sidebar navbar in [frontend/signature-app-frontend/app/dashboard/layout.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/layout.tsx).

---

## 7. Day 11: Final Adjustments (SSR, Revocation, Custom Styling)

- **[MODIFY] SSR DOMMatrix Error Resolution**
  - Shipped `react-pdf` dependency out of Next.js pages to prevent server-side pre-render exceptions.
  - Created client-only rendering modules [PublicPDFRenderer.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/public/[token]/components/PublicPDFRenderer.tsx) and [GuestPDFRenderer.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/sign/[token]/components/GuestPDFRenderer.tsx).
  - Dynamically loaded them via Next.js `dynamic(..., { ssr: false })` within dynamic preview and guest routes, completely resolving the `DOMMatrix is not defined` module evaluation error.

- **[MODIFY] Backend & Client Link Revocation**
  - Added `DELETE /documents/signing-link/{link_id}` endpoint to [backend/routers/documents.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/routers/documents.py). It ensures document ownership matches user context, deletes the record, and appends an audit trace.
  - Added `deleteSigningLink` call helper to [lib/api.ts](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/lib/api.ts).
  - Added a **"Revoke"** option button to the signature requests table in [app/dashboard/signature-requests/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/signature-requests/page.tsx), enabling dynamic revocation of shared links.

- **[MODIFY] Signature Custom Cursive Customization Tab Modal**
  - Imported cursive handwriting Google Fonts (Pacifico, Great Vibes, Dancing Script, Alex Brush) at the top of [app/globals.css](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/globals.css).
  - Overhauled [app/sign/[token]/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/sign/[token]/page.tsx) to render a **"Set your signature details"** styling modal:
    - Custom tabs: "Signature" and "Initials".
    - Font cursive choice selection previews showing dynamic text preview states.
    - Color dots palette presets (slate, red, blue, green).
    - Custom styled text renders with chosen cursive fonts & colors on placed signatures.

- **[MODIFY] Owner PDF Preview Custom Cursive Placements**
  - Added `text`, `font`, and `color` columns to the `Signature` database model ([backend/models/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/models/signature.py)) and updated schemas ([backend/schemas/signature.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/schemas/signature.py)).
  - Executed database alterations to safely inject the new text, font, and color fields.
  - Rewrote [PDFPreview.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/components/PDFPreview.tsx) to implement the identical signature appearance customization sidebar card and settings modal, saving and displaying placed signatures with their configured cursives and colors.

- **[MODIFY] Session Storage Token Expiry & Sign Off**
  - Changed token storage and retrieval client helpers in [lib/auth.ts](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/lib/auth.ts) and [login/page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/(auth)/login/page.tsx) to use browser `sessionStorage` instead of `localStorage`. This ensures the session expires automatically upon closing the tab/website, but persists as long as the page is kept open.
  - Added a red **"Sign Off"** (Logout) button to the right of the header navbar inside [layout.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/layout.tsx), routing users back to `/login` and clearing sessions.

- **[MODIFY] PostgreSQL & Supabase Database Configuration**
  - Updated [backend/.env](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/.env) to comment out the local SQLite fallback and replace it with a standard PostgreSQL Supabase connection string template.
  - Updated [backend/services/database.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/database.py) to automatically inspect `DATABASE_URL` at runtime and map `postgres://` to `postgresql://`, resolving default connection scheme mismatch crashes for SQLAlchemy.
  - Changed `load_dotenv()` to `load_dotenv(override=True)` inside [database.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/database.py) to ensure that manual additions to `.env` consistently override default environment setups.
  - Updated the `is_used` column definition in [backend/models/signing_link.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/models/signing_link.py) to set `default=False` instead of `default=0` to conform to PostgreSQL boolean standards.

- **[MODIFY] Signed PDF Generation Style Customization**
  - Updated `generate_signed_pdf` inside [backend/services/pdf_service.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/pdf_service.py) to read the custom text, color, and font attributes from each placed signature.
  - Added the `hex_to_rgb` helper inside [pdf_service.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/pdf_service.py) to parse hex inputs (e.g., `#ef4444`, `#3b82f6`) into standard PyMuPDF RGB float tuples.
  - Added the `get_font_info` helper inside [pdf_service.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/services/pdf_service.py) mapping selected handwriting web fonts (e.g., Pacifico, Great Vibes, Dancing Script, Alex Brush) to high-quality local cursive font files on the Windows filesystem (e.g., Segoe Script, Ink Free, Gabriola), falling back gracefully to standard formatting if not found.

