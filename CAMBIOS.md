# Orienta IA · versión fusionada

Base: proyecto "Remix" (look and feel, servidor y Gemini) + base de datos y módulos del proyecto "Orienta IA · IFTS 12".

## Qué cambió

**Ciudadano (sin login)**
- Asistente con motor híbrido (`src/services/orientaEngine.ts`): las reglas clasifican las consultas típicas; cuando no alcanzan, Gemini interpreta el texto (`/api/interpretar`). Los requisitos salen siempre de `src/data/db/tramites.json`.
- Filtro de privacidad: si la persona escribe DNI, CUIL, mail o teléfono, se avisa y se enmascara antes de procesar.
- Pestañas: Asistente · Mi checklist · Redactor de nota · Herramientas IA (revisar receta/documento) · Canales de contacto.
- Cada consulta se registra de forma anónima (sin texto) en el servidor (`/api/consultas`).

**Administrador (con login)**
- Botón "Administrador" en el encabezado o "Acceso administrador" en el pie.
- La contraseña se valida en el servidor con la variable `ADMIN_PASSWORD` (Secrets de AI Studio).
- Pestañas: Panel del organismo · Consultas (descarga CSV) · Gestión de trámites (editar, agregar y exportar `tramites.json`).

## Archivos nuevos
- `src/data/db/` → `tramites.json`, `tramitesData.ts`, `types.ts`, `simulatedData.ts`, `checklistAdapter.ts`
- `src/utils/` → `decisionEngine.ts`, `privacyGuard.ts`
- `src/services/orientaEngine.ts`
- `src/components/admin/` → `PanelOrganismo.tsx`, `ConsultasRegistradas.tsx`, `GestionTramites.tsx`
- `src/components/ciudadano/RedactorNota.tsx`
- `src/data/canalesContacto.ts` (reemplaza a `manualCAT.ts`)
- `public/assets/aistudio/consultas_simuladas_d3c394fb.csv`, `tablero_organismo_56a81a0a.json`

## Relación con el diagrama de clases (v2)
| Clase | Dónde está |
|---|---|
| Ciudadano (anónimo) | `ChatInterface.tsx` (sin login) |
| Administrador | `LoginView.tsx` + `/api/admin/*` en `server.ts` |
| AsistenteIA | `orientaEngine.ts` + `/api/interpretar` |
| Consulta | Estado del chat + registro anónimo `/api/consultas` |
| Tramite / Requisito / CanalAtencion | `src/data/db/tramites.json` |
| Checklist | `checklistAdapter.ts` + `ChecklistView.tsx` |
