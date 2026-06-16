# Document Signature & Automation Platform

A comprehensive platform for uploading, annotating (signing), managing, and securely distributing documents with advanced features like digital signatures, public links, and audit logging.

## Key Features

-   **Document Management**:
    -   Upload PDF/Word documents for signing.
    -   Categorize and organize documents in a dashboard.
    -   Secure deletion with audit logging.
    
-   **Interactive Signing**:
    -   Drag-and-drop signature placement on documents.
    -   Supports multiple pages and signatures.
    -   Real-time preview of signed documents.
    
-   **Advanced Features**:
    -   **Generate Signed Document**: Finalizes the document with all signatures embedded.
    -   **Public Link Generation**: Create secure, time-limited public links for downloading or signing documents without authentication.
    -   **Audit Logging**: Comprehensive tracking of all actions including uploads, deletions, and signature placements.
    
-   **Authentication & Security**:
    -   Role-based access control (JWT-based).
    -   IP address logging for all sensitive operations.
    -   Token-based URL signing for secure access.

## Tech Stack

-   **Frontend**: Next.js (React), Tailwind CSS, TypeScript
-   **Backend**: FastAPI (Python), SQLAlchemy
-   **Database**: PostgreSQL
-   **Authentication**: JWT (JSON Web Tokens)
-   **File Processing**: PDFium (via react-pdf)