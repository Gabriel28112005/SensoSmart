# SensoSmart — Documentación Interna de la API

> **Documento de uso interno del equipo de desarrollo.**
> No publicar junto con el código fuente del proyecto.

## Endpoints API

### Públicos
- `POST /api/auth/login` — Inicio de sesión (devuelve JWT con `plan`)
- `GET /api/auth/me` — Datos del usuario autenticado

### Autenticados (Smart y Elite)
- `GET /api/datos/sensores` — Sensores del estadio
- `GET /api/datos/alertas` — Alertas activas
- `GET /api/datos/cumplimiento` — Cumplimiento normativo
- `GET /api/datos/historico` — Datos históricos
- `GET /api/datos/gestion` — Gestión operativa
- `GET /api/ia/fitosanitario` — Detección de amenazas
- `GET /api/ia/riego` — Recomendaciones de riego
- `GET /api/ia/informe-oficial` — Generación de informe
- `GET /api/ia/historial` — Historial de predicciones IA

### Solo Elite (middleware `soloElite`)
- `GET /api/elite/mapa-calor` — Rejilla NDVI 12×6 + estadísticas
- `POST /api/elite/asistente` — Pregunta al asistente IA
- `GET /api/elite/lesiones` — Predicción de riesgo de lesiones
- `GET /api/elite/digital-twin` — Datos para el Twin 3D

### Solo Admin
- `GET /api/usuarios` — Listado de usuarios
- `POST /api/usuarios` — Alta de nuevo usuario
- `DELETE /api/usuarios/:id` — Baja de usuario

## Autenticación
Todos los endpoints autenticados requieren cabecera:
```
Authorization: Bearer <jwt_token>
```

El token JWT incluye `id`, `usuario`, `rol`, `plan`, `club`, `estadio`.
