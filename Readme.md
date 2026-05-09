# SensoSmart - Grupo 15 · UAX · SENER 2026

Plataforma inteligente de sensorización y gestión del césped deportivo para campos de fútbol profesional.

**Versión definitiva con planes Smart y Elite.**

## Instalación

```bash
cd SensoSmart
npm install
node Server.js
```

Abre el navegador en `http://localhost:3000`

## Usuarios de demostración

Las credenciales de demo se encuentran en el archivo interno `documentacion/USUARIOS_DEMO.md`.
Solicítalas al responsable del proyecto si las necesitas.

## Funcionalidades por plan

### Línea SMART
- Dashboard del campo en tiempo real
- 3 IAs activas:
  - 🌿 Detección visual de amenazas fitosanitarias
  - 💧 Recomendador inteligente de riego
  - 📋 Generación automática del informe oficial LaLiga
- Sensores Milesight EM500-SMC-PH
- Cumplimiento normativo automático
- Visita técnica anual incluida

### Línea ELITE (incluye todo lo de Smart, más):
- 🔥 Mapa de calor cromático (NDVI + térmico)
- 💬 Asistente conversacional IA con LLM (Llama 3.2 + RAG)
- 🩺 Predicción de riesgo de lesiones (XGBoost)
- 🌐 Visor 3D del estadio (Digital Twin con Three.js)
- Sensores Decentlab DL-PR26 (Suiza · calibración individual)
- Cámara térmica FLIR FH-Series ID
- Edge AI: NVIDIA Jetson Orin NX (100 TOPS)
- SLA 99,9% · Soporte 24/7 · KAM dedicado
- 4 visitas técnicas anuales + on-demand

## Tecnologías

- **Backend:** Node.js + Express + WebSocket (`ws`) + node-cron
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Visualización 3D:** Three.js r128 (Digital Twin Elite)
- **Generación PDF:** jsPDF + jsPDF-AutoTable
- **Base de datos:** MySQL 8.0
- **Autenticación:** JWT + bcryptjs + middleware de plan

## Estructura del proyecto

```
SensoSmart/
├── Server.js                   # Servidor Express + WebSocket
├── Index.html                  # Pantalla de login
├── package.json
├── html/                       # Páginas HTML del frontend
│   ├── Mapa.html               # Dashboard plan Smart
│   ├── DashboardElite.html     # Dashboard plan Elite
│   ├── Tecnico.html            # Vista de sensores
│   ├── DatosUsuario.html       # Perfil
│   ├── Admin.html              # Panel admin
│   └── Upgrade.html            # Comparativa Smart vs Elite
├── assets/
│   ├── css/
│   ├── images/
│   ├── scriptsFrontend/
│   └── scriptsBackend/
├── baseDeDatos/
│   └── BaseDeDatos.sql
└── documentacion/
    ├── Readme.md               # Este archivo
    ├── API_INTERNA.md          # Endpoints (uso interno)
    └── USUARIOS_DEMO.md        # Credenciales demo (uso interno)
```

## Notas

- Los datos visualizados son simulados para fines de demostración académica.
- El asistente conversacional usa respuestas keyword-based simulando un LLM local (en producción usaría Llama 3.2 3B sobre Jetson Orin NX).
- El Visor 3D renderiza un campo de fútbol estilizado con sensores en posiciones reales y halos animados de calor; la vista cromática pinta el campo con la rejilla NDVI 12×6.
- Las imágenes de los estadios son ilustraciones SVG vectoriales propias para evitar problemas de licencias.

## Licencia

Ver archivo `LICENSE` en la raíz del proyecto. Uso académico exclusivo · Grupo 15 UAX 2026.
