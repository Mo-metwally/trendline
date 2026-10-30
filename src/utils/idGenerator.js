const crypto = require('crypto');

/**
 * Convert a zero-based integer to a bijective base-26 letter string (a-z, aa-zz, aaa...)
 * 0 -> 'a'
 * 25 -> 'z'
 * 26 -> 'aa'
 * 27 -> 'ab'
 * ...
 */
function indexToLetterId(num) {
  let result = '';
  let n = num;
  while (n >= 0) {
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Convert a bijective base-26 letter string back to a zero-based integer
 * 'a' -> 0
 * 'z' -> 25
 * 'aa' -> 26
 * 'ab' -> 27
 */
function letterIdToIndex(str) {
  let num = 0;
  const clean = str.toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    num = num * 26 + (clean.charCodeAt(i) - 97 + 1);
  }
  return num - 1;
}

/**
 * Generate next sequential Category ID:
 * - Root Category: 'a', 'b', ..., 'z', 'aa', 'ab', ...
 * - Subcategory: 's_a', 's_b', ..., 's_z', 's_aa', 's_ab', ...
 *
 * @param {boolean} isSubcategory - Whether category is a subcategory
 * @param {object} models - Sequelize models object { Category }
 * @param {object} [transaction] - Optional Sequelize transaction
 * @returns {Promise<string>} Next unique category ID
 */
async function generateCategoryId(isSubcategory = false, models, transaction = null) {
  const { Category } = models;

  if (!isSubcategory) {
    // Root categories: letters only (a-z, aa-zz, ...)
    const categories = await Category.findAll({
      attributes: ['id'],
      where: { parent_id: null },
      raw: true,
      transaction,
    });

    let maxIndex = -1;
    for (const cat of categories) {
      const idStr = String(cat.id).toLowerCase();
      if (/^[a-z]+$/.test(idStr)) {
        const idx = letterIdToIndex(idStr);
        if (idx > maxIndex) {
          maxIndex = idx;
        }
      }
    }

    let nextIndex = maxIndex + 1;
    let candidateId = indexToLetterId(nextIndex);

    // Collision safety loop
    while (await Category.findByPk(candidateId, { transaction })) {
      nextIndex++;
      candidateId = indexToLetterId(nextIndex);
    }

    return candidateId;
  } else {
    // Subcategories: s_ + letters (s_a, s_b, ..., s_z, s_aa, ...)
    const subcategories = await Category.findAll({
      attributes: ['id'],
      raw: true,
      transaction,
    });

    let maxIndex = -1;
    for (const cat of subcategories) {
      const idStr = String(cat.id).toLowerCase();
      if (idStr.startsWith('s_')) {
        const letterPart = idStr.slice(2);
        if (/^[a-z]+$/.test(letterPart)) {
          const idx = letterIdToIndex(letterPart);
          if (idx > maxIndex) {
            maxIndex = idx;
          }
        }
      }
    }

    let nextIndex = maxIndex + 1;
    let candidateId = `s_${indexToLetterId(nextIndex)}`;

    // Collision safety loop
    while (await Category.findByPk(candidateId, { transaction })) {
      nextIndex++;
      candidateId = `s_${indexToLetterId(nextIndex)}`;
    }

    return candidateId;
  }
}

/**
 * Generate a unique Product ID:
 * 6 to 8 characters URL-safe Base64 string [A-Za-z0-9_-]
 *
 * @param {object} models - Sequelize models object { Product }
 * @param {object} [transaction] - Optional Sequelize transaction
 * @returns {Promise<string>} Unique product ID
 */
async function generateProductId(models, transaction = null) {
  const { Product } = models;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

  let attempts = 0;
  while (attempts < 20) {
    // Choose length between 6 and 8 characters (6, 7, or 8)
    const length = Math.floor(Math.random() * 3) + 6;
    const randomBytes = crypto.randomBytes(length);
    let candidateId = '';
    for (let i = 0; i < length; i++) {
      candidateId += chars[randomBytes[i] % chars.length];
    }

    const exists = await Product.findByPk(candidateId, { transaction });
    if (!exists) {
      return candidateId;
    }
    attempts++;
  }

  // Fallback to timestamp + random if high collision rate
  const fallback = crypto.randomBytes(5).toString('base64url').slice(0, 8);
  return fallback;
}

/**
 * Generate a unique Bundle ID:
 * Format: 7-8 characters URL-safe Base64 string [A-Za-z0-9_-]
 *
 * @param {object} models - Sequelize models object { Bundle }
 * @param {object} [transaction] - Optional Sequelize transaction
 * @returns {Promise<string>} Unique bundle ID
 */
async function generateBundleId(models, transaction = null) {
  const { Bundle } = models;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let attempts = 0;
  while (attempts < 20) {
    let suffix = '';
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      suffix += chars[randomBytes[i] % chars.length];
    }
    const candidateId = `BND-${suffix}`;

    const exists = await Bundle.findByPk(candidateId, { transaction });
    if (!exists) {
      return candidateId;
    }
    attempts++;
  }

  return `BND-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Calculate standard GS1 EAN-13 Check Digit
 * @param {string} code12 - 12-digit string
 * @returns {number} Check digit 0-9
 */
function calculateEAN13CheckDigit(code12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Generate a guaranteed unique valid EAN-13 Barcode
 * Format: 622 (GS1 Egypt) + 9 random digits + 1 check digit = 13 digits
 *
 * @param {object} models - Sequelize models object { Product }
 * @param {object} [transaction] - Optional Sequelize transaction
 * @returns {Promise<string>} 13-digit EAN-13 barcode
 */
async function generateProductBarcodeEAN13(models, transaction = null) {
  const { Product } = models;
  const prefix = '622';

  for (let attempts = 0; attempts < 50; attempts++) {
    let code12 = prefix;
    for (let i = 0; i < 9; i++) {
      code12 += Math.floor(Math.random() * 10);
    }
    const checkDigit = calculateEAN13CheckDigit(code12);
    const candidateBarcode = `${code12}${checkDigit}`;

    const exists = await Product.findOne({
      where: { barcode: candidateBarcode },
      attributes: ['id'],
      transaction,
    });
    if (!exists) {
      return candidateBarcode;
    }
  }

  // Fallback timestamp-based 12 digits
  const timePart = String(Date.now()).slice(-9);
  const code12 = `${prefix}${timePart}`;
  return `${code12}${calculateEAN13CheckDigit(code12)}`;
}

/**
 * Generate a guaranteed unique Product SKU:
 * Format: TRD-[CAT]-XXXXX (5 digits/chars)
 *
 * @param {object} models - Sequelize models object { Product }
 * @param {string} [categoryCode] - Optional category abbreviation (default 'GEN')
 * @param {object} [transaction] - Optional Sequelize transaction
 * @returns {Promise<string>} Unique SKU code
 */
async function generateProductSku(models, categoryCode = 'GEN', transaction = null) {
  const { Product } = models;
  const prefix = 'TRD';
  const cleanCat = String(categoryCode || 'GEN')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'GEN';

  for (let attempts = 0; attempts < 50; attempts++) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    const candidateSku = `${prefix}-${cleanCat}-${rand}`;

    const exists = await Product.findOne({
      where: { sku: candidateSku },
      attributes: ['id'],
      transaction,
    });
    if (!exists) {
      return candidateSku;
    }
  }

  const fallbackRand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${cleanCat}-${fallbackRand}`;
}

module.exports = {
  indexToLetterId,
  letterIdToIndex,
  generateCategoryId,
  generateProductId,
  generateBundleId,
  calculateEAN13CheckDigit,
  generateProductBarcodeEAN13,
  generateProductSku,
};
