# Sairam NCC Website – Performance Stabilization Plan

## Current findings from codebase

1. File uploads and file URLs are handled using **Supabase Storage** (`cadet-files` bucket), while app data and auth are on Firebase (Firestore + Firebase Auth).
2. Large media files (photos/PDFs) are directly uploaded and consumed via public URLs with no size normalization pipeline.
3. Batch cadet retrieval fetches all matching cadets at once for a wing+batch; rendering then groups in browser.
4. Admin login uses Firebase Auth and waits for `onAuthStateChanged` before rendering children.

## Permanent fix strategy (priority order)

## 1) Fix media bottleneck first (largest impact)

- Keep original upload, but generate optimized derivatives on upload:
  - `thumb` (WebP/AVIF ~200px) for list/grid cards
  - `card` (WebP/AVIF ~600px) for modal/detail preview
  - retain original for download/full-screen
- Store derivative URLs and metadata in Firestore document (size, width, height, type).
- Enforce upload limits from admin:
  - images max 2–3 MB before upload
  - PDFs max 8–10 MB, optional compression
- Serve through CDN-backed URLs with long cache-control for immutable files.

### Why this is permanent
Media optimization removes repeated heavy transfer on every page load and scales as records grow.

## 2) Add caching and prefetch controls
- Add aggressive cache headers for static uploaded files:
  - `Cache-Control: public, max-age=31536000, immutable` for versioned paths
- Version file paths (`name_timestamp`) so cache invalidation is automatic.
- Use lazy image loading in grids and non-critical sections.
- Preload only above-the-fold hero asset; avoid eager loading all media.

## 3) Firestore query/index optimization
- Add indexes for frequent query patterns:
  - `cadets: Wing + Batch (+ rank if sorting server-side)`
  - slideshow collections: `order`
- Move sorting/grouping as much as possible to query layer.
- Paginate large cadet batches (`limit`, `startAfter`) if volume grows.

## 4) Reduce admin login perceived latency
- Keep a lightweight loading shell for auth initialization.
- Use persistent auth (`browserLocalPersistence`) if admins expect “stay signed in.”
- Ensure Firebase app/auth initialization happens once and early.
- Minimize expensive post-login data fetches on admin routes (load on demand per tab).

## 5) Observability (to avoid regressions)
- Track:
  - p75/p95 image download size
  - time-to-first-cadet-grid-render
  - admin login-to-dashboard-interactive time
- Set targets:
  - card image transfer <150 KB avg
  - first cadet list visible <1.5s on 4G
  - admin login complete <1.0s (cached session) / <2.5s (fresh)

## Implementation roadmap

### Phase A (1–2 days)
- Enforce upload limits and client-side compression hints.
- Add lazy loading and proper image fetch priorities.
- Confirm required Firestore indexes.

### Phase B (3–5 days)
- Build upload-trigger function/service to create image derivatives.
- Store derivative URLs in Firestore and switch UI list cards to thumbnail URLs.

### Phase C (1–2 days)
- Add performance dashboards and alerting thresholds.
- Tune admin route fetch behavior and cache policy.

## Expected outcome
- Major drop in perceived lag for gallery/cadet pages.
- Smooth scrolling and faster first render on mobile networks.
- Significantly reduced admin friction during login and file operations.
