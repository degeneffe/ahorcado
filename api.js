const FALLBACK_WORDS = [
  'abuela', 'aceite', 'agosto', 'ahorro', 'almeja', 'amable', 'anillo',
  'arriba', 'asunto', 'avance', 'azucar', 'bailar', 'balcon', 'basura',
  'belleza', 'billete', 'blanco', 'bosque', 'brazo', 'brillo', 'caballo',
  'cadena', 'camino', 'cantar', 'cariño', 'caseta', 'centro', 'cerrar',
  'chiste', 'ciudad', 'cocina', 'colina', 'comida', 'compra', 'conejo',
  'corona', 'cuenta', 'delfin', 'dental', 'dibujo', 'dulces', 'efecto',
  'empleo', 'encima', 'equipo', 'escala', 'espejo', 'evento', 'exacto',
  'fabula', 'famoso', 'fiebre', 'filtro', 'flauta', 'flores', 'frente',
  'fuente', 'futuro', 'garaje', 'gafas', 'globo', 'granja', 'guerra',
  'hablar', 'hierba', 'hombre', 'humano', 'imagen', 'indice', 'jardin',
  'jueves', 'laguna', 'lengua', 'libros', 'limite', 'lluvia', 'madera',
  'mancha', 'medida', 'mezcla', 'mirada', 'modelo', 'molino', 'musica',
  'nacion', 'nativo', 'nervio', 'objeto', 'oculto', 'oferta', 'otoño',
  'paloma', 'pájaro', 'pepino', 'piedra', 'planta', 'pueblo', 'puente',
  'quince', 'receta', 'relato', 'rincon', 'romper', 'sangre', 'semana',
  'sierra', 'sombra', 'tejado', 'tesoro', 'tierra', 'trueno', 'tumba',
  'último', 'veneno', 'verano', 'vidrio', 'vuelta', 'zapato', 'zurdo',
  'abrigo', 'actriz', 'adorno', 'alarma', 'aldea', 'alerta', 'altura',
  'amargo', 'ancla', 'animal', 'antena', 'aplauso', 'arena', 'armario',
  'asador', 'ataque', 'aurora', 'avion', 'azafran', 'bambu', 'banana',
  'barril', 'bellota', 'bigote', 'bodega', 'boleto', 'bonito', 'botella',
  'brisa', 'bronce', 'bufanda', 'burro', 'buzón', 'cabeza', 'cactus',
  'cajón', 'calma', 'camisa', 'canela', 'capote', 'carpa', 'castillo',
  'cedro', 'ceniza', 'cereza', 'ciervo', 'circo', 'clavel', 'cobija',
  'collar', 'colmena', 'cometa', 'concha', 'cordel', 'crimen', 'cuadro',
  'cuchara', 'cumbre', 'danza', 'debate', 'delantal', 'destino', 'dinero',
  'dragon', 'duende', 'ejemplo', 'elefante', 'embudo', 'encanto', 'enigma',
  'entrada', 'escalera', 'espada', 'establo', 'estrella', 'eterna',
  'falda', 'faro', 'fiesta', 'flecha', 'fogata', 'fortuna', 'frasco',
  'gancho', 'gaviota', 'gemelo', 'gigante', 'girasol', 'glaciar', 'golpe',
  'gorra', 'granizo', 'grieta', 'guante', 'guitarra', 'halcón', 'hamaca',
  'helado', 'herida', 'hielo', 'higuera', 'hoguera', 'hormiga', 'huerto',
  'iglesia', 'imán', 'ingenio', 'isla', 'jazmín', 'jinete', 'jirafa',
  'jungla', 'ladrillo', 'lámina', 'lancha', 'lectura', 'leña', 'linterna',
  'lobo', 'loma', 'lucero', 'lunes', 'magia', 'maleta', 'manguera',
  'manzana', 'marfil', 'marinero', 'martillo', 'melón', 'mercado',
  'montaña', 'morena', 'muela', 'nieve', 'noche', 'novela', 'nube',
  'nuez', 'oasis', 'oleaje', 'oliva', 'orilla', 'oveja', 'pañuelo',
  'parque', 'pastel', 'pelota', 'pirata', 'playa', 'pluma', 'pradera',
  'princesa', 'pulpo', 'rascacielos', 'rayo', 'regalo', 'reloj', 'remo'
];

async function getRandomWord() {
  const minLen = 5;
  const maxLen = 10;
  const randomLen = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

  // Si estamos offline, usar directamente el diccionario local
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
  }

  // Intento 1: API Greenborn
  try {
    const res = await fetch(
      `https://clientes.api.greenborn.com.ar/public-random-word?c=1&l=${randomLen}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const word = (Array.isArray(data) ? data[0] : data).toString().trim().toLowerCase();
      if (word && /^[a-záéíóúüñ]+$/.test(word) && word.length >= minLen) {
        return word;
      }
    }
  } catch (_) { /* fallback */ }

  // Intento 2: Random Word API
  try {
    const res = await fetch(
      `https://random-word-api.herokuapp.com/word?lang=es&length=${randomLen}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const word = (Array.isArray(data) ? data[0] : data).toString().trim().toLowerCase();
      if (word && /^[a-záéíóúüñ]+$/.test(word) && word.length >= minLen) {
        return word;
      }
    }
  } catch (_) { /* fallback */ }

  // Intento 3: diccionario local
  return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
}

function normalizeChar(ch) {
  const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
  return map[ch] || ch;
}

if (typeof module !== 'undefined') module.exports = { getRandomWord, normalizeChar, FALLBACK_WORDS };
