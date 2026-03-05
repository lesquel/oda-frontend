# Oda — Frontend

> Aplicación móvil de la red social de poesía Oda, construida con Expo y React Native.

## Stack

- **Expo SDK 54** · React Native 0.81 · New Architecture habilitada
- **Expo Router 6** — navegación file-based
- **NativeWind v4** — Tailwind CSS para React Native
- **Zustand** — gestión de estado global
- **Axios** — cliente HTTP con interceptor JWT
- **@gorhom/bottom-sheet** — selector de emociones
- **date-fns** — fechas relativas en español
- **Fuentes:** Cormorant Garamond (display) · EB Garamond (poemas) · Montserrat (UI)

## Inicio rápido

```bash
bun install
bun run start       # Expo dev server
bun run android     # Android
bun run ios         # iOS
```

## Variables de entorno

Crea un archivo `.env` (copia `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

Para dispositivo físico, usa la IP de tu máquina:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api
```

## Estructura

```
app/
  _layout.tsx              Layout raíz (auth guard + fuentes)
  login.tsx                Pantalla de inicio de sesión
  register.tsx             Registro de usuario
  compose.tsx              Editor de poemas
  modal.tsx
  (tabs)/
    _layout.tsx            Tab bar (Inicio · Buscar · Perfil · Ajustes)
    index.tsx              Feed con scroll infinito
    explore.tsx            Búsqueda de poemas
    profile.tsx            Perfil del usuario + stats
    settings.tsx           Ajustes de tema / tipografía / escala
  poem/
    [id].tsx               Sala de lectura (detalle de poema)

features/
  auth/
    components/            LoginForm, RegisterForm
    services/auth-api.ts   Axios instance + métodos auth
    store/auth-store.ts    Zustand store de sesión
  poems/
    components/
      poem-card.tsx        Tarjeta de poema
      emotion-selector.tsx Bottom sheet de emociones
    hooks/use-poem-feed.ts Hook de scroll infinito
    services/poems-api.ts  API de poemas
    types/poem.ts          Tipos TypeScript
  users/
    services/users-api.ts  API de perfiles y stats

components/ui/
  text.tsx     button.tsx  input.tsx  card.tsx  icon-symbol.tsx

constants/
  colors.ts    Sistema de colores (ink/paper/surface/pencil/wax)
```

## Design System

| Token       | Color     | Uso                       |
|-------------|-----------|---------------------------|
| `ink`       | `#2C2C2C` | Texto principal           |
| `paper`     | `#F9F7F1` | Fondo principal           |
| `surface`   | `#FFFEFA` | Fondo elevado (tarjetas)  |
| `pencil`    | `#8C867D` | Texto secundario          |
| `wax`       | `#A84438` | Acento / CTAs             |

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro |
| `/(tabs)/` | Feed principal con scroll infinito |
| `/(tabs)/explore` | Búsqueda |
| `/(tabs)/profile` | Perfil + estadísticas del usuario |
| `/(tabs)/settings` | Ajustes de app |
| `/poem/[id]` | Sala de lectura con emociones |
| `/compose` | Editor de poemas (nuevo/editar) |

## Notas de tipografía

- Las fuentes se cargan en `app/_layout.tsx` con `useFonts`.
- El tab bar usa `Typography.fontFamily.ui` para los labels.

## Type-check

```bash
npx tsc --noEmit
```
