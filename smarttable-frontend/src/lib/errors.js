export function getErrorMessage(error, fallback = 'Une erreur est survenue') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (typeof data.message === 'string') return data.message;

  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }

  if (typeof data.error === 'string') return data.error;

  return fallback;
}
