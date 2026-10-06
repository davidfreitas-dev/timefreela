# Rules specific to views (pages)

A view is a routed entry point. Its job is to **orchestrate**: read the route, load data, pick states, and compose child components.

## 1. Responsibilities
A view MAY:
- Read route params/query (`useRoute`) and navigate (`useRouter`).
- Connect stores and composables.
- Decide which state to render (loading, error, empty, content).
- Compose child components and pass them plain props.

A view SHOULD NOT:
- Contain long template sections (extract them to child components).
- Hold formatting, filtering or business rules inline (move to composables/utils).
- Call HTTP clients directly (use a service called from a composable or store).

## 2. Route as a source of state
Convert route params once, in a computed, with type safety:
```ts
const route = useRoute()
const productId = computed(() => Number(route.params.id))
```
Pass `productId` (a ref/computed) to composables so they react to param changes.

## 3. Page data loading
- Put loading logic in a composable (`useProductDetail(productId)`), returning `product`, `isLoading`, `hasError`, `reload`.
- Use `watch(source, load, { immediate: true })` (or `watchEffect`) so navigating between `/products/1` and `/products/2` reloads the data; `onMounted` alone does not.
- Cancel or ignore stale requests when the param changes or the view unmounts (`AbortController` or `onWatcherCleanup`).

## 4. Splitting a big view
Extract a child component when a template section:
- Has its own visual identity (gallery, summary, filters, form).
- Depends on a subset of the state.
- Would be reused or tested on its own.

Keep in the view only what is shared across sections. Prefer props/emits; use `provide/inject` or Pinia for deep sharing.

## 5. Page-level concerns
- Guards and `meta` stay in the router config; do not duplicate them inside the view.
- Page title/SEO: a small composable (`usePageTitle`).
- Redirects after actions (save, delete) belong to the view, not to child components. Children emit an event, the view navigates.

## 6. States
Render loading, error and empty explicitly at the view level, and keep children free of those concerns.

## 7. Ionic + Capacitor projects (apply only if the project uses Ionic)
- Ionic keeps previous pages alive in the stack, so `onMounted` runs once. For data that must refresh on every visit, use `onIonViewWillEnter` (and `onIonViewDidLeave` for cleanup).
- The view root should be `IonPage`; keep `IonHeader`/`IonContent` structure intact when refactoring.
- Do not move native plugin calls (Capacitor) into UI components; keep them in composables/services called by the view.
