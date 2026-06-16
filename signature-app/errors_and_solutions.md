# Errors and Solutions

This document documents every error encountered during the restoration of the Document Signature app, including compilation, runtime, layout, and database schema issues, and explains how they were solved.

---

## 1. SyntaxError: parameter without a default follows parameter with a default

- **Context**: Occurred in `backend/routers/documents.py`, `backend/routers/signature.py`, and `backend/routers/audit_logs.py`.
- **Cause**: Function signatures declared parameters without defaults (like `request: Request`) AFTER parameters with defaults (like `db: Session = Depends(get_db)`). Python syntax requires parameters without default values to be listed first.
- **Error Log**:
  ```
  File "D:\Labmentix\DocSign\Document-Signature-App\signature-app\backend\routers\audit_logs.py", line 14
    request: Request,
    ^^^^^^^^^^^^^^^^
  SyntaxError: parameter without a default follows parameter with a default
  ```
- **Solution**: Reordered the parameters inside the endpoint function declarations to place non-default inputs (like `request: Request` and path parameters like `document_id`) at the beginning of the parameters list, before dependencies with default parameters.

---

## 2. ModuleNotFoundError: No module named 'models.audit_log'

- **Context**: Occurred in `backend/services/audit_service.py` during module imports.
- **Cause**: The file containing the `AuditLog` database model was named `audit_logs.py` (plural) inside the `models` directory, but the audit service attempted to load it from `models.audit_log` (singular), which did not exist.
- **Solution**: Changed the import statement in `backend/services/audit_service.py` to:
  ```python
  from models.audit_logs import AuditLog
  ```

---

## 3. NameError: name 'APIRounter' is not defined

- **Context**: Occurred in `backend/routers/audit_logs.py` during router instance creation.
- **Cause**: A typographical spelling error: `APIRounter()` instead of `APIRouter()`.
- **Solution**: Corrected `router = APIRounter()` to:
  ```python
  router = APIRouter()
  ```

---

## 4. NameError: name 'Request' is not defined / NameError: name 'create_audit_log' is not defined

- **Context**: Occurred inside router files during runtime execution.
- **Cause**: FastAPI's `Request` object and the custom `create_audit_log` function were used in the route methods, but they were missing from the import list at the top of the file.
- **Solution**: Added the required imports:
  - Imported `Request` from `fastapi` inside `backend/routers/documents.py` and `backend/routers/signature.py`.
  - Imported `create_audit_log` from `services.audit_service` inside `backend/routers/documents.py`.

---

## 5. UnboundLocalError: local variable 'FRONTEND_URL' referenced before assignment

- **Context**: Occurred in `create_signing_link` in `backend/routers/documents.py`.
- **Cause**: The code attempted to build `signing_url` using the variable `FRONTEND_URL`, but the line fetching it from the environment variable (`FRONTEND_URL = os.getenv("FRONTEND_URL")`) was placed AFTER the URL assembly block.
- **Solution**: Reordered the instructions so that the environment lookup occurs first:
  ```python
  frontend_url = os.getenv("FRONTEND_URL") or "http://localhost:3000"
  signing_url = f"{frontend_url}/sign/{doc_token}"
  ```

---

## 6. NameError: name 'user' / 'document' is not defined in route handlers

- **Context**: Occurred in `delete_document` and `upload_document` in `backend/routers/documents.py`, as well as `public_sign` in `backend/routers/signature.py`.
- **Cause**: The audit logger function `create_audit_log` was called passing `user.id` or `document.id`. However, these variables were never queried or defined in the scope of those endpoints. In `delete_document`, the document was deleted before logging, leaving the variable undefined.
- **Solution**:
  - Queried the `User` object at the beginning of the handlers using:
    ```python
    user = db.query(User).filter(User.email == current_user).first()
    ```
  - Replaced the undefined `document.id` in `delete_document` with `document_id` since the document ID is passed as a path parameter.
  - Replaced the undefined `document.id` in `public_sign` with `link.document_id` retrieved from the verified signing link database object.

---

## 7. Signature Placement Integer Coordinates Rounding Error

- **Context**: Occurred in `backend/models/signature.py`.
- **Cause**: The model declared coordinate columns `x` and `y` as `Integer`. Since coordinates represent fractional offsets (values between `0` and `1`), they were rounded down to `0` or rounded up to `1` when written to the database. This caused all placed signatures to break and lock to the top-left corner (0, 0) upon retrieval.
- **Solution**:
  - Imported `Float` from `sqlalchemy`.
  - Modified the signature schema columns to `Float`:
    ```python
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    ```

---

## 8. TypeScript Type Checking Failures during Next.js build

- **Context**: Occurred in `app/dashboard/documents/components/PDFPreview.tsx` at line 69.
- **Cause**: The API call `mySignatures()` returned a promise of type `ApiResult<unknown>`. The frontend code mapped over `signs.data` without checking `signs.success` first. As a result, the compiler flagged a type checking failure because `data` does not exist on error result signatures.
- **Error Log**:
  ```
  Type error: Property 'data' does not exist on type '{ success: true; data: unknown; } | { success: boolean; message: string; }'.
  ```
- **Solution**:
  - Fully typed the API client return payloads inside `lib/api.ts` so `mySignatures` returns a defined array schema `Promise<ApiResult<ApiSignature[]>>`.
  - Added a defensive check `if (!signs || !signs.success) return;` prior to reading `signs.data` in `PDFPreview.tsx`.

---

## 9. Broken Image Layouts for Documents without Thumbnails

- **Context**: Occurred on the documents list page `app/dashboard/documents/components/Cards/DocumentCard.tsx`.
- **Cause**: Documents that did not have a thumbnail generated (e.g. upload failures, text files) had `document.thumbnail` set to `null`. Rendering `<img src={`${BASE_URL}${document.thumbnail}`} />` caused the browser to fetch a broken link (ending in `null`).
- **Solution**: Added a conditional render in the JSX markup. When `document.thumbnail` is present, it renders the thumbnail image; otherwise, it displays a premium slate-grey placeholder box showing a file icon and the text "NO THUMBNAIL".

---

## 10. Unauthorized (401) Error on First Login / Register Block
- **Context**: Occurred when attempting to register or log in after setting up the SQLite backend database configuration.
- **Cause**: 
  1. The new `.env` configuration switched the backend to a fresh local SQLite database `docsign.db`, which starts completely empty.
  2. The frontend login page did not contain any links or buttons to navigate to the `/register` route. As a result, users had no way to access the registration screen to create an account first.
  3. Additionally, CORS settings in `backend/main.py` only allowed `http://localhost:3000` and `https://vigilant-enigma-...`. When the client loaded the app from the IP address `http://127.0.0.1:3000`, the browser blocked registration and login calls.
- **Solution**: 
  - Imported `Link` from `next/link` and integrated navigation toggles between the Login and Register forms ("Don't have an account? Sign Up" / "Already have an account? Log In").
  - Updated the backend `CORSMiddleware` config in [main.py](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/backend/main.py) to explicitly include `http://127.0.0.1:3000` in the `allow_origins` array.

---

## 11. 500 Internal Server Error when generating Public Signing Link (Invalid Resend API Key)
- **Context**: Occurred during local development when clicking "Generate Public Link" on a document.
- **Cause**: The backend attempted to send an email to the signer using `resend.Emails.send(...)`. Since local environment files contain a placeholder key (`re_dummy_key`), the library raised an uncaught `resend.exceptions.ResendError: API key is invalid` exception, causing the endpoint to crash and return a `500` status.
- **Solution**: Wrapped the `send_signing_email` dispatch in a `try-except` block. If the API key is missing or invalid, it prints a warning to the console but allows the database entry and link generation to proceed successfully.

---

## 12. Warning: A param property was accessed directly with `params.token`
- **Context**: Occurred in browser console when rendering the dynamic route `app/dashboard/public/[token]/page.tsx`.
- **Cause**: Next.js 15+ deprecates synchronous access of route parameter properties because `params` is now a Promise. Accessing `params.token` synchronously throws warnings or exceptions in newer runtimes.
- **Solution**: Imported the `use` hook from `'react'` and unwrapped the `params` Promise at the start of the page component:
  ```typescript
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  ```
  Replaced all references of `params.token` with the resolved `token` string variable.

---

## 13. Redundant Duplicate Document Previews on Public Document Page
- **Context**: Occurred on the dynamic public preview page `/dashboard/public/[token]`.
- **Cause**: The left panel rendered the static document thumbnail image (which displays page 1 of the PDF document), and the right panel rendered the dynamic paginated PDF viewer (which also displays page 1 of the PDF document by default). This caused page 1 of the document to render twice, side-by-side, creating redundant duplicate viewports.
- **Solution**: Removed the large thumbnail image section from the left column of [page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/public/[token]/page.tsx). Replaced it with a metadata information card showing document filename, recipient email, expiration dates, and a page icon.

---

## 14. White Page Background leaks at the bottom of the Dashboard / Overflow Glitch
- **Context**: Occurred on the main dashboard documents view page.
- **Cause**: 
  1. The page layout had a fixed height constraint `h-[calc(100vh-80px)]` and a massive top margin `mt-60` (`240px`) wrapping the document grid. This caused the document grid to overflow the dashboard container.
  2. Because the container height was fixed, the outer layout wrapper (`min-h-screen`) did not expand to fit the overflowing items. 
  3. Consequently, the documents list was rendered outside the dark background wrapper, exposing the default white `<body>` background of the browser at the bottom and sides.
- **Solution**:
  - Removed the fixed height `h-[calc(100vh-80px)]` in [page.tsx](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/dashboard/documents/page.tsx) to allow the container to grow dynamically.
  - Adjusted the top margin wrapper from `mt-60` to a balanced `mt-8`.
  - Modified [globals.css](file:///d:/Labmentix/DocSign/Document-Signature-App/signature-app/frontend/signature-app-frontend/app/globals.css) to set the default body background to `#020617` (dark) to ensure that the layout is visually seamless even if elements shift.

---

## 15. Day 11 Schema Evolution and Locked Previews on Already-Used Links

- **Context**: Occurred when testing public signing status tracking and rejection flow.
- **Cause**:
  1. Adding `status` and `rejection_reason` columns to the `SigningLinks` database table. In SQLAlchemy, calling `create_all` does not alter tables if they already exist, meaning SQLite would fail with `no such column` errors when reading/writing status or reason.
  2. The `/public-document/preview/{token}` and `/public-document/pdf/{token}` endpoints returned a `410 (This signing link has already been used)` error when `is_used` was true. This prevented the client from displaying post-sign success information or post-reject statuses when users re-visited the link or when the owner checked details.
- **Solution**:
  1. Created and ran a safe Python schema alteration migration script (`migrate.py`) to connect to the SQLite instance and run `ALTER TABLE SigningLinks ADD COLUMN ...` queries if they were not already present.
  2. Overhauled the `/public-document/preview/{token}` and `/public-document/pdf/{token}` endpoints to lift the `is_used` constraint, returning preview and metadata along with the active `status` and `rejection_reason` values, enabling conditional frontend rendering.

---

## 16. ReferenceError: DOMMatrix is not defined during module evaluation

- **Context**: Occurred inside dynamic routes `/dashboard/public/[token]` and `/sign/[token]` when pages were pre-rendered on the server.
- **Cause**: The `react-pdf` library accesses browser-only globals (like `DOMMatrix`). Because Next.js pre-evaluates ES modules on the server side, it threw a `ReferenceError: DOMMatrix is not defined` during SSR module loading.
- **Solution**: Modularized the PDF-rendering logic out of the main route pages into client-only components (`PublicPDFRenderer.tsx` and `GuestPDFRenderer.tsx`). Imported these components dynamically using Next.js `dynamic(..., { ssr: false })` inside the route pages. This prevents the server from importing `react-pdf` at module evaluation time, restricting loading purely to browser environments.

---

## 17. Expiry of Session Token after Five Minutes (Access Token Lifetime & Browser Storage)

- **Context**: Occurred in the dashboard interfaces while using the application.
- **Cause**: Storing access tokens in `localStorage` meant that the credentials persisted indefinitely but expired based on a set backend timeline (which defaulted to short durations or was affected by page-left open states). Additionally, the user requested that session authentication start expiring only after they leave the website or close the tab, rather than persisting permanently.
- **Solution**: 
  1. Switched storage writes and retrievals on the client side from `localStorage` to `sessionStorage` in `lib/auth.ts` and `login/page.tsx`. This ensures that as long as the browser tab is kept open (even if left idle), the token is retained, but is immediately deleted when the browser tab is closed.
  2. Added a navbar **"Sign Off"** logout button to allow users to explicitly terminate their sessions, clear both sessionStorage and localStorage, and redirect to the login form.



