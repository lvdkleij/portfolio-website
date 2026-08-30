# Shared layout for `/`
No navigation, footer, sidebar or layout component wraps this route. Root `frontend/app/app.vue` renders the route and screen-reader route announcer.
```vue
<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>

```

