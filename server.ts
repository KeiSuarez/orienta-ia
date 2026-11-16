import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '12mb' }));

/* ------------------------------------------------------------------ */
/* Gemini                                                              */
/* ------------------------------------------------------------------ */

const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

/** Enmascara datos personales antes de mandar texto a la IA. */
function enmascararDatos(texto: string): string {
  return texto
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[CORREO]')
    .replace(/\b(20|23|24|27|30|33|34)[-\s]?\d{8}[-\s]?\d\b/g, '[CUIL]')
    .replace(/\b\d{1,2}\.?\d{3}\.?\d{3}\b/g, '[NUMERO]')
    .slice(0, 1500);
}

interface ItemCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
  ejemplos?: string[];
}

/** Catálogo por defecto: el tramites.json del proyecto (por si el cliente no lo envía). */
function catalogoDelProyecto(): ItemCatalogo[] {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'src/data/db/tramites.json'), 'utf-8');
    const json = JSON.parse(raw);
    return (json.tramites || []).map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      ejemplos: t.ejemplos_usuario,
    }));
  } catch {
    return [];
  }
}

const CONDICIONES = [
  'relacion_dependencia',
  'monotributista',
  'monotributo_social',
  'servicio_domestico',
  'jubilado_pensionado',
  'seguro_desempleo',
  'prepaga_adherente',
  'prepaga_via_agente_seguro',
];
const BENEFICIARIOS = ['titular', 'conyuge_conviviente', 'hijo_menor_21', 'hijo_estudiante_21_25', 'persona_cud'];

/* ------------------------------------------------------------------ */
/* Salud del servicio                                                  */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', aiAvailable: !!ai, modelo: MODELO_GEMINI });
});

/* ------------------------------------------------------------------ */
/* AsistenteIA.interpretarConsulta(): Gemini solo clasifica            */
/* ------------------------------------------------------------------ */

app.post('/api/interpretar', async (req: Request, res: Response) => {
  const { texto, etapa, tramiteActual, catalogo } = req.body || {};
  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({ error: 'Texto requerido' });
  }
  if (!ai) {
    return res.json({ interpretacion: null, motivo: 'IA no configurada' });
  }

  const lista: ItemCatalogo[] =
    Array.isArray(catalogo) && catalogo.length > 0 ? catalogo.slice(0, 60) : catalogoDelProyecto();
  const ids = lista.map((t) => String(t.id));

  const catalogoTexto = lista
    .map(
      (t) =>
        `- id: ${t.id} | ${t.nombre}${t.descripcion ? ` | ${t.descripcion}` : ''}${
          t.ejemplos?.length ? ` | ejemplos: ${t.ejemplos.slice(0, 4).join(' / ')}` : ''
        }`
    )
    .join('\n');

  const instrucciones = `Sos el módulo de interpretación de "Orienta IA", un asistente académico que orienta sobre trámites de obras sociales y prepagas ante la Superintendencia de Servicios de Salud (SSSalud) de Argentina.
Tu única tarea es CLASIFICAR el mensaje de la persona. No respondas al usuario, no redactes requisitos ni consejos.

Catálogo de trámites disponibles:
${catalogoTexto}

Reglas:
- tramite_id: el id del catálogo que corresponde al problema. Si no corresponde a ninguno o no está claro, usá "ninguno".
- tipo_entidad: "obra_social", "prepaga" o "no_informa".
- condicion: la situación laboral del titular si se menciona; si no, "no_informa".
- beneficiario: para quién es el trámite si se menciona; si no, "no_informa".
- fuera_de_alcance: true solo si el mensaje no tiene relación con salud, obras sociales o prepagas.
- No inventes datos que la persona no dijo.
${etapa && etapa !== 'init' ? `Contexto: el asistente le acaba de preguntar a la persona un dato (etapa "${etapa}") del trámite "${tramiteActual ?? 'sin definir'}". Interpretá su respuesta para ese dato.` : ''}`;

  try {
    const respuesta: any = await conTimeout(
      ai.models.generateContent({
        model: MODELO_GEMINI,
        contents: [{ role: 'user', parts: [{ text: enmascararDatos(texto) }] }],
        config: {
          systemInstruction: instrucciones,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tramite_id: { type: Type.STRING, enum: [...ids, 'ninguno'] },
              tipo_entidad: { type: Type.STRING, enum: ['obra_social', 'prepaga', 'no_informa'] },
              condicion: { type: Type.STRING, enum: [...CONDICIONES, 'no_informa'] },
              beneficiario: { type: Type.STRING, enum: [...BENEFICIARIOS, 'no_informa'] },
              fuera_de_alcance: { type: Type.BOOLEAN },
            },
            required: ['tramite_id', 'tipo_entidad', 'condicion', 'beneficiario', 'fuera_de_alcance'],
          },
        },
      }),
      8000
    );

    const datos = JSON.parse(respuesta?.text || '{}');
    const valido = (v: unknown, opciones: string[]) => (typeof v === 'string' && opciones.includes(v) ? v : null);

    return res.json({
      interpretacion: {
        tramite_id: valido(datos.tramite_id, ids),
        tipo_entidad: valido(datos.tipo_entidad, ['obra_social', 'prepaga']),
        condicion: valido(datos.condicion, CONDICIONES),
        beneficiario: valido(datos.beneficiario, BENEFICIARIOS),
        fuera_de_alcance: datos.fuera_de_alcance === true,
      },
    });
  } catch (error: any) {
    console.warn('Interpretación con IA no disponible:', error?.message || error);
    return res.json({ interpretacion: null, motivo: 'IA no disponible' });
  }
});

/* ------------------------------------------------------------------ */
/* Herramientas IA del ciudadano: revisión de documentación            */
/* ------------------------------------------------------------------ */

function auditoriaPorPalabrasClave(documentText: string) {
  const t = (documentText || '').toLowerCase();
  const tieneFirma = /\b(dr|dra|firma|mat|matr[ií]cula|sello)\b/.test(t);
  const tieneDiagnostico = /(diag|cie|paciente|recet|indicaci)/.test(t);
  const completo = tieneFirma && tieneDiagnostico;
  return {
    tipoDocumento: t.includes('recibo') ? 'Recibo de sueldo' : 'Prescripción médica / orden de prestación',
    estado: completo ? 'Parece completo' : 'Revisar antes de presentar',
    observacionesPositivas: [
      tieneDiagnostico ? 'Menciona diagnóstico o indicación médica.' : 'Tiene texto legible para revisar.',
      ...(tieneFirma ? ['Menciona firma, sello o matrícula del profesional.'] : []),
    ],
    elementosFaltantes: completo
      ? []
      : [
          'Verificá que se vea la firma y el sello con el número de matrícula del médico.',
          'Revisá que la fecha de la prescripción sea reciente.',
          'Si es un medicamento o tratamiento especial, sumá un resumen de historia clínica.',
        ],
    recomendacionCiudadana:
      'Revisión orientativa por palabras clave. Antes de presentar, confirmá que el documento sea legible y tenga firma, sello, diagnóstico y fecha.',
  };
}

app.post('/api/ai/audit-document', async (req: Request, res: Response) => {
  const { documentText, documentBase64, mimeType, tipoTramite } = req.body || {};

  if (ai && (documentBase64 || documentText)) {
    try {
      const partes: any[] = [];
      if (typeof documentBase64 === 'string' && documentBase64.includes('base64,')) {
        partes.push({
          inlineData: {
            mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
            data: documentBase64.split('base64,')[1],
          },
        });
      }
      partes.push({
        text: `Revisá este documento para un trámite ante la SSSalud${tipoTramite ? ` ("${tipoTramite}")` : ''}.
${documentText ? `Texto aportado por la persona: ${enmascararDatos(String(documentText))}` : ''}
Indicá si se ve firma, sello con matrícula, diagnóstico y fecha. No transcribas nombres, DNI ni números de afiliado.`,
      });

      const respuesta: any = await conTimeout(
        ai.models.generateContent({
          model: MODELO_GEMINI,
          contents: [{ role: 'user', parts: partes }],
          config: {
            systemInstruction:
              'Sos un revisor orientativo de documentación médica para trámites de obras sociales en Argentina. Respondés en español rioplatense, breve y claro. Nunca repetís datos personales. Tu revisión es orientativa, no una aprobación oficial.',
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tipoDocumento: { type: Type.STRING },
                estado: { type: Type.STRING, enum: ['Parece completo', 'Revisar antes de presentar', 'No se puede leer'] },
                observacionesPositivas: { type: Type.ARRAY, items: { type: Type.STRING } },
                elementosFaltantes: { type: Type.ARRAY, items: { type: Type.STRING } },
                recomendacionCiudadana: { type: Type.STRING },
              },
              required: ['tipoDocumento', 'estado', 'observacionesPositivas', 'elementosFaltantes', 'recomendacionCiudadana'],
            },
          },
        }),
        15000
      );
      return res.json(JSON.parse(respuesta?.text || '{}'));
    } catch (error: any) {
      console.warn('Revisión con IA no disponible:', error?.message || error);
    }
  }

  if (documentText) {
    return res.json(auditoriaPorPalabrasClave(String(documentText)));
  }

  return res.json({
    tipoDocumento: 'Documento sin revisar',
    estado: 'No se pudo revisar',
    observacionesPositivas: [],
    elementosFaltantes: [
      'Verificá que se vea la firma y el sello con la matrícula del profesional.',
      'Revisá que la fecha sea reciente y el diagnóstico sea legible.',
    ],
    recomendacionCiudadana:
      'La revisión automática de imágenes no está disponible en este momento. Probá pegando el texto del documento o volvé a intentar más tarde.',
  });
});

/* ------------------------------------------------------------------ */
/* Registro anónimo de consultas                                       */
/* ------------------------------------------------------------------ */

const ARCHIVO_CONSULTAS = path.resolve(process.cwd(), 'data', 'consultas_registradas.json');
const RESULTADOS = ['Respondida', 'Derivada al canal oficial', 'Aclaró su alcance'];
const MAX_CONSULTAS = 20000;

let consultas: Record<string, string>[] = [];
try {
  consultas = JSON.parse(fs.readFileSync(ARCHIVO_CONSULTAS, 'utf-8'));
  if (!Array.isArray(consultas)) consultas = [];
} catch {
  consultas = [];
}

let guardadoPendiente: NodeJS.Timeout | null = null;
function guardarConsultas() {
  if (guardadoPendiente) return;
  guardadoPendiente = setTimeout(() => {
    guardadoPendiente = null;
    fs.mkdir(path.dirname(ARCHIVO_CONSULTAS), { recursive: true }, () => {
      fs.writeFile(ARCHIVO_CONSULTAS, JSON.stringify(consultas), (err) => {
        if (err) console.warn('No se pudo guardar el registro de consultas:', err.message);
      });
    });
  }, 1000);
}

const campo = (v: unknown, def = 'No informa') => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : def);

app.post('/api/consultas', (req: Request, res: Response) => {
  const b = req.body || {};
  if (!RESULTADOS.includes(b.resultado)) {
    return res.status(400).json({ error: 'Resultado inválido' });
  }
  const hoy = new Date().toISOString().split('T')[0];
  // Solo se guardan estos campos; nunca texto libre ni datos personales.
  consultas.push({
    fecha: hoy,
    tramite_detectado: campo(b.tramite_detectado, '(sin clasificar)'),
    resultado: b.resultado,
    condicion: campo(b.condicion),
    tipo_entidad: campo(b.tipo_entidad),
    entidad: campo(b.entidad),
    provincia: campo(b.provincia),
    rango_edad: campo(b.rango_edad),
    mes: hoy.slice(0, 7),
  });
  if (consultas.length > MAX_CONSULTAS) consultas = consultas.slice(-MAX_CONSULTAS);
  guardarConsultas();
  res.status(201).json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Administrador: login y endpoints protegidos                         */
/* ------------------------------------------------------------------ */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
if (!ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD no está configurada: el acceso de administrador queda deshabilitado.');
}

const sesiones = new Map<string, number>(); // token -> vencimiento
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
const intentosFallidos = new Map<string, { n: number; hasta: number }>();

function igualesSeguro(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const vence = sesiones.get(token);
  if (!token || !vence || vence < Date.now()) {
    if (token) sesiones.delete(token);
    return res.status(401).json({ error: 'Sesión vencida o inválida' });
  }
  next();
}

app.post('/api/admin/login', (req: Request, res: Response) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Falta configurar ADMIN_PASSWORD en los Secrets del proyecto.' });
  }
  const ip = req.ip || 'desconocida';
  const bloqueo = intentosFallidos.get(ip);
  if (bloqueo && bloqueo.n >= 5 && bloqueo.hasta > Date.now()) {
    return res.status(429).json({ error: 'Demasiados intentos. Esperá unos minutos.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !igualesSeguro(password, ADMIN_PASSWORD)) {
    const previo = intentosFallidos.get(ip);
    intentosFallidos.set(ip, { n: (previo?.n ?? 0) + 1, hasta: Date.now() + 5 * 60 * 1000 });
    return res.status(401).json({ error: 'Contraseña incorrecta, intentá otra vez.' });
  }

  intentosFallidos.delete(ip);
  const token = crypto.randomBytes(24).toString('hex');
  sesiones.set(token, Date.now() + DURACION_SESION_MS);
  res.json({ token, nombre: 'Administrador de contenidos' });
});

app.get('/api/admin/verificar', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  sesiones.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/consultas', requireAdmin, (_req, res) => {
  res.json({ total: consultas.length, consultas });
});

/* ------------------------------------------------------------------ */
/* Servidor                                                            */
/* ------------------------------------------------------------------ */

async function startServer() {
  const downloadsDir = path.resolve(__dirname, 'public/downloads');
  app.use(
    '/downloads',
    express.static(downloadsDir, {
      setHeaders: (res, filePath) => {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      },
    })
  );

  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Orienta IA en http://0.0.0.0:${PORT} (IA: ${ai ? MODELO_GEMINI : 'no configurada'})`);
  });
}

startServer();
