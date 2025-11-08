/**
 * Utilidades para manejo de fechas con zona horaria correcta (America/Lima - UTC-5)
 *
 * Este módulo proporciona funciones para convertir fechas seleccionadas por el usuario
 * en formato ISO, preservando exactamente la fecha seleccionada sin alteraciones
 * por diferencias de zona horaria.
 */

/**
 * Convierte una fecha seleccionada (formato YYYY-MM-DD) a ISO string
 * preservando exactamente el día seleccionado.
 *
 * Si es la fecha actual, incluye la hora del sistema actual.
 * Si es una fecha pasada, usa las 00:00:00 del día seleccionado.
 *
 * @param selectedDate - Fecha en formato YYYY-MM-DD (como viene del input type="date")
 * @param includeCurrentTime - Si true y es fecha de hoy, incluye hora actual del sistema
 * @returns ISO string con la fecha correcta en zona horaria America/Lima
 */
export function convertDateToISO(
  selectedDate: string,
  includeCurrentTime: boolean = true
): string {
  if (!selectedDate) {
    return new Date().toISOString();
  }

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  // Si es la fecha de hoy y se solicita incluir hora actual
  if (selectedDate === todayStr && includeCurrentTime) {
    return new Date().toISOString();
  }

  // Parsear la fecha seleccionada en componentes
  const [year, month, day] = selectedDate.split('-').map(Number);

  // Crear una fecha a las 00:00:00 en la interpretación local
  // Esto asegura que la fecha no cambie debido a zona horaria
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Obtener los componentes para construir ISO manualmente
  const isoString = dateObj.getFullYear() + '-' +
    String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
    String(dateObj.getDate()).padStart(2, '0') + 'T00:00:00.000Z';

  return isoString;
}

/**
 * Convierte una fecha seleccionada a ISO string incluyendo la hora actual del sistema.
 * Útil para cuando quieres registrar la fecha exacta con la hora en que se registra.
 *
 * @param selectedDate - Fecha en formato YYYY-MM-DD
 * @returns ISO string con fecha seleccionada y hora actual
 */
export function convertDateWithCurrentTime(selectedDate: string): string {
  if (!selectedDate) {
    return new Date().toISOString();
  }

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  // Si es la fecha de hoy, usa hora actual del sistema
  if (selectedDate === todayStr) {
    return today.toISOString();
  }

  // Si es fecha pasada, crea timestamp con hora actual pero fecha seleccionada
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  // Reemplaza la fecha pero mantiene la hora actual
  const now = new Date();
  dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  return dateObj.toISOString();
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns String con formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
}

/**
 * Formatea un ISO string o Date a un string legible en formato 'YYYY-MM-DD HH:mm:ss'
 * @param date - ISO string o Date object
 * @returns String formateado
 */
export function formatDateWithTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formatea un ISO string o Date a un string legible en formato 'YYYY-MM-DD'
 * @param date - ISO string o Date object
 * @returns String formateado
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
