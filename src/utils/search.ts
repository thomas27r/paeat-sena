/**
 * Normalizes text by converting to lowercase, stripping accents/diacritics, and trimming whitespace.
 * e.g., "José María" -> "jose maria"
 */
export const normalizeText = (text: string = ''): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Matches a student against a single search query (Name, Document, or Grade).
 */
export const matchStudent = (
  student: { fullName: string; documentNumber: string; grade?: string },
  query: string
): boolean => {
  if (!query || !query.trim()) return true;

  const q = normalizeText(query);
  const name = normalizeText(student.fullName);
  const doc = normalizeText(student.documentNumber);
  const grade = student.grade ? normalizeText(student.grade) : '';

  return (
    name.includes(q) ||
    doc.includes(q) ||
    grade === q ||
    grade.includes(q) ||
    `${grade}°` === q ||
    `grado ${grade}` === q
  );
};

/**
 * Matches a student against individual filter fields (nombre, documento, grupo).
 */
export const matchStudentFilters = (
  student: { fullName: string; documentNumber: string; grade: string },
  filters?: { nombre?: string; documento?: string; grupo?: string }
): boolean => {
  if (!filters) return true;

  const normNombre = normalizeText(filters.nombre || '');
  const normDoc = normalizeText(filters.documento || '');
  const normGrupo = normalizeText(filters.grupo || '');

  if (normNombre && !normalizeText(student.fullName).includes(normNombre)) {
    return false;
  }

  if (normDoc && !normalizeText(student.documentNumber).includes(normDoc)) {
    return false;
  }

  if (normGrupo && normalizeText(student.grade) !== normGrupo) {
    return false;
  }

  return true;
};

/**
 * Formats a grade string with the degree symbol, e.g. "5" -> "5°"
 */
export const formatGradeLabel = (grade: string = ''): string => {
  if (!grade) return '';
  return grade.endsWith('°') ? grade : `${grade}°`;
};

/**
 * Capitalizes a name into proper Title Case avoiding all-uppercase strings.
 * e.g. "JUAN DIEGO CASTAÑO RAMIREZ" -> "Juan Diego Castaño Ramirez"
 */
export const toTitleCase = (str: string = ''): string => {
  if (!str) return '';
  const minorWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
  const words = str.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, idx) => {
      if (!word) return '';
      if (idx > 0 && minorWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

