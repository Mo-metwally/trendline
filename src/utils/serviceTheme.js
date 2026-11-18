/**
 * Service Card Theme Utility
 * Computes background styles, contrast colors, and finish classes
 * for storefront service cards (matching the Admin Studio live preview exactly).
 */

export function isColorDark(hexColor = '') {
  if (!hexColor || typeof hexColor !== 'string') return true;
  const hex = hexColor.replace('#', '').trim();
  if (hex.length < 3) return true;
  const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(fullHex.substring(0, 2), 16) || 0;
  const g = parseInt(fullHex.substring(2, 4), 16) || 0;
  const b = parseInt(fullHex.substring(4, 6), 16) || 0;
  // Perceived brightness
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance < 170;
}

export function getServiceCardTheme(service = {}) {
  const mode = service.theme_mode || 'preset';
  const preset = service.preset_style || 'card-white-glass';
  const finish = service.surface_finish || 'glass';

  let background = '#ffffff';
  let color = '#0f172a';
  let isDark = false;
  let borderColor = 'rgba(226, 232, 240, 0.9)';

  if (mode === 'solid') {
    const hex = service.solid_color || '#0057C2';
    background = hex;
    isDark = isColorDark(hex);
    color = isDark ? '#ffffff' : '#0f172a';
    borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(15, 23, 42, 0.12)';
  } else if (mode === 'gradient') {
    const c1 = service.gradient_color1 || '#0057C2';
    const c2 = service.gradient_color2 || '#002f6c';
    const angle = typeof service.gradient_angle === 'number' ? service.gradient_angle : 135;
    background = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
    isDark = isColorDark(c1) || isColorDark(c2);
    color = isDark ? '#ffffff' : '#0f172a';
    borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.12)';
  } else {
    // Presets
    switch (preset) {
      case 'card-primary-cta':
        background = 'linear-gradient(135deg, #0057C2 0%, #003c88 100%)';
        color = '#ffffff';
        isDark = true;
        borderColor = 'rgba(255, 255, 255, 0.22)';
        break;
      case 'card-bank-promo':
        background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
        color = '#ffffff';
        isDark = true;
        borderColor = 'rgba(255, 255, 255, 0.16)';
        break;
      case 'card-cyber-purple':
        background = 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)';
        color = '#ffffff';
        isDark = true;
        borderColor = 'rgba(255, 255, 255, 0.22)';
        break;
      case 'card-neon-emerald':
        background = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)';
        color = '#ffffff';
        isDark = true;
        borderColor = 'rgba(255, 255, 255, 0.22)';
        break;
      case 'card-sunset-coral':
        background = 'linear-gradient(135deg, #ea580c 0%, #991b1b 100%)';
        color = '#ffffff';
        isDark = true;
        borderColor = 'rgba(255, 255, 255, 0.22)';
        break;
      case 'card-white-glass':
      default:
        background = 'rgba(255, 255, 255, 0.95)';
        color = '#0f172a';
        isDark = false;
        borderColor = 'rgba(226, 232, 240, 0.9)';
        break;
    }
  }

  return {
    style: {
      background,
      color,
      borderColor,
    },
    isDark,
    finish,
  };
}
