export const MENU_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo

export const MENU_IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

export const MENU_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export function validateMenuImageFile(file) {
  if (!file) return { valid: true };

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.',
    };
  }

  if (file.size > MENU_IMAGE_MAX_BYTES) {
    return {
      valid: false,
      error: 'L\'image ne doit pas dépasser 2 Mo.',
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
