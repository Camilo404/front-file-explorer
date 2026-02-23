# Plan de Implementación de WebSockets en Frontend (Angular)

Este plan detalla la integración del cliente WebSocket en la aplicación Angular `front-file-explorer` para recibir actualizaciones en tiempo real del backend.

## 1. Arquitectura

Implementaremos un servicio centralizado `WebSocketService` que manejará la conexión, reconexión automática y distribución de mensajes a través de RxJS.

### 1.1. Ubicación
- `src/app/core/websocket/websocket.service.ts`

### 1.2. Responsabilidades
- Conectar al endpoint `ws://HOST/api/v1/ws?token=JWT`.
- Manejar la reconexión automática (Exponential Backoff).
- Deserializar mensajes JSON.
- Exponer un `Subject` o `Observable` para cada tipo de evento o un stream global filtrable.

## 2. Tipos de Eventos

Basado en la implementación del backend, los eventos esperados son:

```typescript
export enum WSEventType {
  FileCreated = 'file.created',
  FileUploaded = 'file.uploaded',
  FileDeleted = 'file.deleted',
  FileMoved = 'file.moved',
  FileCopied = 'file.copied',
  DirCreated = 'dir.created',
  JobStarted = 'job.started',
  JobProgress = 'job.progress',
  JobCompleted = 'job.completed',
  JobFailed = 'job.failed'
}

export interface WSEvent<T = any> {
  id: string;
  type: WSEventType;
  payload: T;
  timestamp: string;
  actor_id?: string;
}
```

## 3. Integración en Componentes/Servicios

### 3.1. `ExplorerPage` / `FileList`
- **Objetivo:** Actualizar la lista de archivos automáticamente cuando ocurren cambios en el directorio actual.
- **Lógica:**
  - Suscribirse a eventos `file.*` y `dir.*`.
  - Verificar si el evento afecta al directorio actual (comparar `parent` o `path`).
  - Si afecta, recargar la lista (`refresh()`) o actualizar la lista localmente (optimistic UI).

### 3.2. `RecentJobsService` / `JobsPage`
- **Objetivo:** Mostrar progreso de trabajos en segundo plano en tiempo real.
- **Lógica:**
  - Suscribirse a eventos `job.*`.
  - Actualizar el estado del job en la lista local.
  - Mostrar notificaciones "Toast" cuando un job termina (`job.completed` o `job.failed`).

### 3.3. `AuthStore`
- **Objetivo:** Desconectar el WebSocket al hacer Logout y conectar al hacer Login.

## 4. Pasos de Implementación

### Paso 1: Configuración
1.  Agregar `wsUrl` en `src/environments/environment.ts` y `environment.production.ts`.

### Paso 2: Servicio Core
1.  Crear `src/app/core/websocket/websocket.models.ts` con las interfaces.
2.  Crear `src/app/core/websocket/websocket.service.ts`.
    - Inyectar `AuthStore` para obtener el token.
    - Implementar métodos `connect()` y `disconnect()`.
    - Implementar `on<T>(type: WSEventType): Observable<T>`.

### Paso 3: Integración
1.  En `App.ts` o `ShellComponent`, inicializar la conexión si el usuario está logueado.
2.  En `ExplorerPage`, escuchar eventos y refrescar.
3.  En `RecentJobsService` (o crear `JobsService` si no existe lógica de estado), escuchar eventos de jobs.

### Paso 4: UX (Opcional pero recomendado)
1.  Mostrar indicador de "Conectado/Desconectado" o un pequeño dot verde/rojo en el header.
2.  Mostrar "Toasts" globales para eventos importantes (ej: "Archivo subido por otro usuario").

## 5. Consideraciones
- **Seguridad:** El token JWT se pasa por Query Param. Asegurar que se use `wss://` en producción.
- **Rendimiento:** Evitar recargas innecesarias si el evento es sobre un archivo que no está en la vista actual.
