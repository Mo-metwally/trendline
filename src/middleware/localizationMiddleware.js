/**
 * Localization Middleware
 * Detects visitor language preference from query (?lang=ar|en) or headers (Accept-Language).
 * Provides a helper to return optimized storefront payloads.
 */
const localizationMiddleware = (req, res, next) => {
  let locale = 'ar';

  if (req.query && (req.query.lang === 'ar' || req.query.lang === 'en')) {
    locale = req.query.lang;
  } else if (req.headers['accept-language']) {
    const primary = req.headers['accept-language'].split(',')[0].toLowerCase();
    if (primary.startsWith('en')) {
      locale = 'en';
    }
  }

  req.locale = locale;

  /**
   * Helper function to project bilingual models for guest storefront
   */
  res.localize = (item) => {
    if (!item) return item;

    if (Array.isArray(item)) {
      return item.map((i) => res.localize(i));
    }

    const plain = typeof item.toJSON === 'function' ? item.toJSON() : { ...item };

    // Standard field transformations
    const isEn = locale === 'en';
    if (plain.name_ar !== undefined) plain.name = isEn ? (plain.name_en || plain.name_ar) : plain.name_ar;
    if (plain.description_ar !== undefined) plain.description = isEn ? (plain.description_en || plain.description_ar) : plain.description_ar;
    if (plain.short_desc_ar !== undefined) plain.short_desc = isEn ? (plain.short_desc_en || plain.short_desc_ar) : plain.short_desc_ar;
    if (plain.title_ar !== undefined) plain.title = isEn ? (plain.title_en || plain.title_ar) : plain.title_ar;
    if (plain.subtitle_ar !== undefined) plain.subtitle = isEn ? (plain.subtitle_en || plain.subtitle_ar) : plain.subtitle_ar;
    if (plain.badge_text_ar !== undefined) plain.badge_text = isEn ? (plain.badge_text_en || plain.badge_text_ar) : plain.badge_text_ar;
    if (plain.button_text_ar !== undefined) plain.button_text = isEn ? (plain.button_text_en || plain.button_text_ar) : plain.button_text_ar;
    if (plain.governorate_ar !== undefined) plain.governorate = isEn ? plain.governorate_en : plain.governorate_ar;
    if (plain.estimated_days_ar !== undefined) plain.estimated_days = isEn ? plain.estimated_days_en : plain.estimated_days_ar;

    return plain;
  };

  next();
};

module.exports = localizationMiddleware;
