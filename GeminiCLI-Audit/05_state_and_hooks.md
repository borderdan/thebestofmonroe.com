# 05 Client State & Hooks

## State Management
* **Zustand** is the primary state management library.
* Two primary stores were identified: `use-cart-store.ts` and `use-guest-cart-store.ts`.

## Persistence Strategy
* The Zustand stores utilize the `persist` middleware.
* Although `idb-keyval` is present in `package.json` (implying IndexedDB usage), standard JSON storage is being utilized in the cart stores. If offline capabilities for POS are expected, moving these to IndexedDB via custom storage adapters in Zustand is necessary.

## Offline Queue & Hydration
* **Hydration Mismatch Risks**: Standard use of `persist` in Zustand without a hydration flag (e.g., `hasHydrated` state check before rendering) often leads to React hydration mismatches on the client side, especially for carts rendered on SSR pages.
* No dedicated offline mutation queue was found in the codebase. Offline POS capabilities may be brittle if relying purely on network requests failing without a replay queue.