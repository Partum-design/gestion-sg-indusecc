var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var NORA_DAILY_LIMIT_PER_USER = parseInt(process.env.NORA_DAILY_LIMIT_PER_USER, 10) || 40;
var NORA_DAILY_LIMIT_GLOBAL = parseInt(process.env.NORA_DAILY_LIMIT_GLOBAL, 10) || 300;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NORA_GEMINI_API_KEY;
  // gemini-2.5-flash redacta hallazgos de auditoría notablemente mejor que la
  // variante lite; se puede regresar a la anterior con la variable GEMINI_MODEL.
  var model = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || process.env.NORA_GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta configurar GOOGLE_API_KEY o GEMINI_API_KEY en el servidor.'
    });
  }

  var quota = await checkNoraQuota(req);
  if (quota && quota.allowed === false) {
    return res.status(429).json({ error: quota.message });
  }

  var payload = req.body || {};
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      payload = {};
    }
  }

  var conversation = normalizeConversation(payload.conversation, payload.question);
  var systemPrompt = buildSystemPrompt(payload);
  var contents = buildContents(conversation, payload.question);

  try {
    var response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    });

    var data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: extractGeminiError(data)
      });
    }

    var text = extractGeminiText(data);
    if (!text) {
      return res.status(502).json({
        error: 'Gemini respondió sin texto utilizable.'
      });
    }

    return res.status(200).json({
      text: text,
      model: model,
      provider: 'Google Gemini'
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Error inesperado en NORA.'
    });
  }
};

function normalizeConversation(conversation, question) {
  var source = Array.isArray(conversation) ? conversation.slice(-12) : [];
  var normalized = [];
  var i;
  var questionText = normalizeText(question);

  for (i = 0; i < source.length; i += 1) {
    var item = source[i] || {};
    var text = normalizeText(item.text);
    if (!text) continue;
    if (i === source.length - 1 && item.role === 'user' && questionText && text === questionText) {
      continue;
    }
    normalized.push({
      role: item.role === 'user' ? 'user' : 'model',
      text: text
    });
  }

  return normalized;
}

function buildContents(conversation, question) {
  var contents = [];
  var i;

  for (i = 0; i < conversation.length; i += 1) {
    contents.push({
      role: conversation[i].role,
      parts: [{ text: conversation[i].text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: normalizeText(question) || 'Ayúdame con la auditoría.' }]
  });

  return contents;
}

function buildSystemPrompt(payload) {
  var lines = [
    'Eres NORA, auditora líder virtual de INDUSECC especializada en sistemas de gestión ISO.',
    'Trabajas con el método de la Norma ISO 19011 y con el contexto de auditoría en México: las normas ISO se adoptan como NMX (por ejemplo NMX-CC-9001-IMNC-2015), los organismos certificadores están acreditados por la EMA, la trazabilidad de calibración se refiere al CENAM y la capacitación se acredita con constancias DC-3 de la STPS.',
    'Responde siempre en español, con lenguaje claro, directo y profesional de auditor. Sin introducciones, elogios, relleno ni frases de asistente artificial.',
    'Regla innegociable: nunca inventes evidencia, documentos, folios, fechas ni resultados. Solo puedes describir lo que el auditor ya registró o proponer plantillas con espacios marcados como [completar].',
    'Un hallazgo se redacta con tres elementos: el hecho observado (qué se vio y dónde), el requisito incumplido (apartado de la norma) y la evidencia objetiva que lo sustenta. Nunca uses opiniones ni adjetivos de valor.',
    'Criterios de clasificación que debes aplicar: No conformidad mayor = ausencia total del requisito, falla sistémica o riesgo directo para el producto, el cliente o el cumplimiento legal. No conformidad menor = incumplimiento puntual y aislado que no compromete al sistema. Observación = situación conforme que podría degradarse si no se atiende. Oportunidad de mejora = cumple y puede optimizarse. Conforme = cumple con evidencia suficiente.',
    'Si falta información para concluir, dilo con claridad y pregunta exactamente por el dato que falta, una sola pregunta.',
    'Mantén la respuesta por debajo de 220 palabras salvo que se pida más detalle.'
  ];

  if (payload && payload.intent === 'fill') {
    lines.push('Intención detectada: ayudar al auditor a documentar este punto. Responde EXACTAMENTE con este formato, una etiqueta por línea y sin texto adicional antes ni después:');
    lines.push('ESTADO: Cumple | Parcial | No cumple | N/A (déjalo vacío si el auditor todavía no registró evidencia ni hallazgo)');
    lines.push('RIESGO: Bajo | Medio | Alto | Crítico (vacío si no hay base para estimarlo)');
    lines.push('CATEGORIA: Conforme | Observación | No conformidad menor | No conformidad mayor | Oportunidad de mejora (vacío si no hay base)');
    lines.push('HALLAZGO: redacción del hallazgo en una o dos frases. Si el auditor aún no registró nada, entrega una plantilla con marcadores [completar] en lugar de inventar hechos.');
    lines.push('EVIDENCIA: qué evidencia objetiva debe solicitarse o revisarse para sustentar este punto, separada por punto y coma.');
    lines.push('VERIFICAR: la pregunta o revisión concreta que falta hacer en sitio para cerrar el punto.');
    lines.push('No agregues encabezados, viñetas, negritas ni comentarios fuera de esas seis etiquetas.');
  }

  if (payload && payload.activeIso) {
    lines.push('Norma activa: ' + safeText(payload.activeIso.code) + ' (' + safeText(payload.activeIso.version || 'N/D') + ').');
    if (payload.activeIso.focus) lines.push('Enfoque: ' + safeText(payload.activeIso.focus) + '.');
    if (payload.activeIso.summary) lines.push('Resumen: ' + safeText(payload.activeIso.summary) + '.');
  }

  if (payload && payload.clause) {
    lines.push('Punto auditado: ' + safeText(payload.clause.number || payload.clause.id) + ' - ' + safeText(payload.clause.title) + '.');
    if (payload.clause.definition) lines.push('Criterio literal del requisito: ' + safeText(payload.clause.definition));
    if (payload.clause.evidence && payload.clause.evidence.length) lines.push('Evidencia típica de este punto: ' + safeText(payload.clause.evidence.join('; ')) + '.');
  }

  if (payload && payload.finding) {
    lines.push('Registro actual del auditor en este punto -> Estado: ' + safeText(payload.finding.status || 'sin registrar') + '; Riesgo: ' + safeText(payload.finding.risk || 'sin registrar') + '; Categoría: ' + safeText(payload.finding.category || 'sin registrar') + '.');
    lines.push('Hallazgo capturado: ' + (payload.finding.note ? safeText(payload.finding.note) : 'ninguno todavía') + '.');
    lines.push('Evidencia adjunta por el auditor: ' + (payload.finding.evidenceSummary ? safeText(payload.finding.evidenceSummary) : 'ninguna todavía') + '.');
  }

  if (payload && payload.auditSummary) {
    lines.push('Avance: ' + safeText(payload.auditSummary.progress || 0) + '%; ' + safeText(payload.auditSummary.evaluated || 0) + ' de ' + safeText(payload.auditSummary.total || 0) + ' requisitos evaluados.');
    lines.push('Pendientes: ' + safeText(payload.auditSummary.remaining || 0) + '; cumplen: ' + safeText(payload.auditSummary.ok || 0) + '; parciales: ' + safeText(payload.auditSummary.partial || 0) + '; no cumplen: ' + safeText(payload.auditSummary.bad || 0) + '; evidencias: ' + safeText(payload.auditSummary.evidenceTotal || 0) + '.');
    if (payload.auditSummary.nextClauseId) lines.push('Siguiente requisito pendiente: ' + safeText(payload.auditSummary.nextClauseId) + ' - ' + safeText(payload.auditSummary.nextClauseTitle || '') + '.');
  }

  if (payload && payload.project) {
    if (payload.project.name) lines.push('Organización auditada: ' + safeText(payload.project.name) + '.');
    if (payload.project.auditor) lines.push('Equipo auditor: ' + safeText(payload.project.auditor) + '.');
    if (payload.project.site) lines.push('Sitio: ' + safeText(payload.project.site) + '.');
    if (payload.project.objective) lines.push('Objetivo de la auditoría: ' + safeText(payload.project.objective));
    if (payload.project.criteria) lines.push('Criterio de auditoría declarado: ' + safeText(payload.project.criteria));
    if (payload.project.scope) lines.push('Alcance: ' + safeText(payload.project.scope) + '.');
  }

  return lines.join(' ');
}

function extractGeminiText(data) {
  if (!data) return '';
  if (typeof data.text === 'string') return data.text.trim();

  if (Array.isArray(data.candidates)) {
    var i;
    for (i = 0; i < data.candidates.length; i += 1) {
      var candidate = data.candidates[i] || {};
      var content = candidate.content || {};
      var parts = Array.isArray(content.parts) ? content.parts : [];
      var text = parts.map(function (part) {
        return part && typeof part.text === 'string' ? part.text : '';
      }).join('').trim();
      if (text) return text;
    }
  }

  return '';
}

function extractGeminiError(data) {
  if (!data) return 'Gemini respondió con un error desconocido.';
  if (data.error && data.error.message) return String(data.error.message);
  if (typeof data.error === 'string') return data.error;
  if (data.promptFeedback && data.promptFeedback.blockReason) {
    return 'La solicitud fue bloqueada por seguridad: ' + String(data.promptFeedback.blockReason);
  }
  return 'Gemini respondió con un error desconocido.';
}

function normalizeText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function safeText(value) {
  return normalizeText(value);
}

function clientIp(req) {
  var forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

async function resolveNoraIdentity(req) {
  var token = String((req.headers && req.headers.authorization) || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      var userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + token }
      });
      if (userResponse.ok) {
        var user = await userResponse.json();
        if (user && user.id) return 'user:' + user.id;
      }
    } catch (error) {
      // Si falla la validación de sesión, se usa la IP como respaldo.
    }
  }
  return 'ip:' + clientIp(req);
}

async function registerNoraUsage(identity, max) {
  var response = await fetch(SUPABASE_URL + '/rest/v1/rpc/nora_register_usage', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_identity: identity, p_max: max })
  });
  if (!response.ok) return null;
  var data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

// Límite antiabuso: si Supabase no está configurado o la comprobación falla,
// se deja pasar la solicitud (el gasto ya está acotado por maxOutputTokens y
// el modelo económico por defecto); esto solo añade un tope diario extra.
async function checkNoraQuota(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    var globalResult = await registerNoraUsage('__global__', NORA_DAILY_LIMIT_GLOBAL);
    if (globalResult && globalResult.allowed === false) {
      return {
        allowed: false,
        message: 'NORA alcanzó su límite diario de uso en toda la plataforma. Vuelve a intentarlo mañana.'
      };
    }

    var identity = await resolveNoraIdentity(req);
    var identityResult = await registerNoraUsage(identity, NORA_DAILY_LIMIT_PER_USER);
    if (identityResult && identityResult.allowed === false) {
      return {
        allowed: false,
        message: 'Alcanzaste tu límite diario de ' + NORA_DAILY_LIMIT_PER_USER + ' consultas a NORA. Vuelve a intentarlo mañana.'
      };
    }

    return { allowed: true };
  } catch (error) {
    return null;
  }
}
