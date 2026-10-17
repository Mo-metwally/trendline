const { sequelize } = require('./src/config/db');
const { indexToLetterId } = require('./src/utils/idGenerator');
const crypto = require('crypto');

function generateRandomBase64(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function runMigration() {
  const client = await sequelize.getQueryInterface().sequelize;
  console.log(' Starting Category & Product ID Schema Migration to Base-26 & Base64...');

  try {
    // 1. Drop existing Foreign Key constraints
    console.log('1. Dropping existing foreign keys...');
    const dropConstraints = [
      'ALTER TABLE bundle_categories DROP CONSTRAINT IF EXISTS bundle_categories_category_id_fkey',
      'ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey',
      'ALTER TABLE category_tags DROP CONSTRAINT IF EXISTS category_tags_category_id_fkey',
      'ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_category_id_fkey',
      'ALTER TABLE bundle_items DROP CONSTRAINT IF EXISTS bundle_items_product_id_fkey',
      'ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_product_id_fkey',
      'ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey',
      'ALTER TABLE order_return_items DROP CONSTRAINT IF EXISTS order_return_items_product_id_fkey',
      'ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_product_id_fkey',
      'ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey',
      'ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey',
      'ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_product_id_fkey',
      'ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS purchase_order_items_product_id_fkey',
    ];

    for (const sql of dropConstraints) {
      await client.query(sql);
    }
    console.log('   All constraints dropped successfully.');

    // 2. Alter column types to VARCHAR(50)
    console.log('2. Altering column types to VARCHAR(50)...');
    const alterColumns = [
      // Category PK and FKs
      'ALTER TABLE categories ALTER COLUMN id DROP DEFAULT',
      'ALTER TABLE categories ALTER COLUMN id TYPE VARCHAR(50) USING id::VARCHAR(50)',
      'ALTER TABLE categories ALTER COLUMN parent_id TYPE VARCHAR(50) USING parent_id::VARCHAR(50)',
      'ALTER TABLE category_tags ALTER COLUMN category_id TYPE VARCHAR(50) USING category_id::VARCHAR(50)',
      'ALTER TABLE product_categories ALTER COLUMN category_id TYPE VARCHAR(50) USING category_id::VARCHAR(50)',
      'ALTER TABLE bundle_categories ALTER COLUMN category_id TYPE VARCHAR(50) USING category_id::VARCHAR(50)',

      // Product PK and FKs
      'ALTER TABLE products ALTER COLUMN id DROP DEFAULT',
      'ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(50) USING id::VARCHAR(50)',
      'ALTER TABLE product_categories ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE product_images ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE product_tags ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE product_reviews ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE bundle_items ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE inventory_transactions ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE order_return_items ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50)',
      'ALTER TABLE purchase_order_items ALTER COLUMN product_id TYPE VARCHAR(50) USING purchase_order_items::VARCHAR(50)',
    ];

    for (const sql of alterColumns) {
      try {
        await client.query(sql);
      } catch (err) {
        console.warn('   Note on column alter:', err.message);
      }
    }
    console.log('   Columns altered to VARCHAR(50).');

    // 3. Migrate existing Category records
    console.log('3. Migrating Category IDs...');
    const [categories] = await client.query('SELECT id, parent_id FROM categories ORDER BY id::INTEGER ASC');

    let rootIdx = 0;
    let subIdx = 0;
    const catMap = new Map(); // oldId -> newId

    // Map root categories first
    for (const cat of categories) {
      if (!cat.parent_id) {
        const newId = indexToLetterId(rootIdx++);
        catMap.set(String(cat.id), newId);
      }
    }

    // Map subcategories next
    for (const cat of categories) {
      if (cat.parent_id) {
        const newId = `s_${indexToLetterId(subIdx++)}`;
        catMap.set(String(cat.id), newId);
      }
    }

    console.log('   Category Map:', Array.from(catMap.entries()));

    // Apply category mappings
    for (const [oldId, newId] of catMap.entries()) {
      await client.query(`UPDATE categories SET id = '${newId}' WHERE id = '${oldId}'`);
      await client.query(`UPDATE categories SET parent_id = '${newId}' WHERE parent_id = '${oldId}'`);
      await client.query(`UPDATE category_tags SET category_id = '${newId}' WHERE category_id = '${oldId}'`);
      await client.query(`UPDATE product_categories SET category_id = '${newId}' WHERE category_id = '${oldId}'`);
      await client.query(`UPDATE bundle_categories SET category_id = '${newId}' WHERE category_id = '${oldId}'`);
    }
    console.log('   Categories migrated successfully.');

    // 4. Migrate existing Product records
    console.log('4. Migrating Product IDs...');
    const [products] = await client.query('SELECT id FROM products ORDER BY id::INTEGER ASC');
    const prodMap = new Map();
    const usedProdIds = new Set();

    for (const prod of products) {
      let newId;
      do {
        newId = generateRandomBase64(Math.random() > 0.5 ? 7 : 8);
      } while (usedProdIds.has(newId));
      usedProdIds.add(newId);
      prodMap.set(String(prod.id), newId);
    }

    console.log('   Product Map (first 5):', Array.from(prodMap.entries()).slice(0, 5));

    for (const [oldId, newId] of prodMap.entries()) {
      await client.query(`UPDATE products SET id = '${newId}' WHERE id = '${oldId}'`);
      await client.query(`UPDATE product_categories SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE product_images SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE product_tags SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE product_reviews SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE bundle_items SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE inventory_transactions SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE order_items SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE order_return_items SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
      await client.query(`UPDATE purchase_order_items SET product_id = '${newId}' WHERE product_id = '${oldId}'`);
    }
    console.log('   Products migrated successfully.');

    // 5. Re-add foreign key constraints
    console.log('5. Re-adding Foreign Key constraints...');
    const addConstraints = [
      'ALTER TABLE categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL',
      'ALTER TABLE category_tags ADD CONSTRAINT category_tags_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE',
      'ALTER TABLE product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE',
      'ALTER TABLE bundle_categories ADD CONSTRAINT bundle_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE',

      'ALTER TABLE product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
      'ALTER TABLE product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
      'ALTER TABLE product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
      'ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
      'ALTER TABLE bundle_items ADD CONSTRAINT bundle_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
      'ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT',
      'ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL',
      'ALTER TABLE order_return_items ADD CONSTRAINT order_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT',
      'ALTER TABLE purchase_order_items ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT',
    ];

    for (const sql of addConstraints) {
      await client.query(sql);
    }
    console.log('   All Foreign Key constraints recreated successfully.');

    console.log(' Migration finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
