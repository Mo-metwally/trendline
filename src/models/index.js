const { sequelize } = require('../config/db');

// Module 1: Admin & Auth
const AdminUser = require('./AdminUser');
const AdminOtp = require('./AdminOtp');

// Module 2: Catalog, Smart Categories, Tags & Bundles
const Brand = require('./Brand');
const Category = require('./Category');
const Tag = require('./Tag');
const CategoryTag = require('./CategoryTag');
const Product = require('./Product');
const ProductCategory = require('./ProductCategory');
const ProductTag = require('./ProductTag');
const ProductImage = require('./ProductImage');
const ProductReview = require('./ProductReview');
const Bundle = require('./Bundle');
const BundleItem = require('./BundleItem');
const BundleCategory = require('./BundleCategory');

// Module 3: Built-in ERP - WMS, Procurement & Inventory Ledger
const InventoryTransaction = require('./InventoryTransaction');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');

// Module 4: Order Lifecycle, RMA & Financials
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const OrderTrackingLog = require('./OrderTrackingLog');
const OrderReturn = require('./OrderReturn');
const OrderReturnItem = require('./OrderReturnItem');
const FinancialTransaction = require('./FinancialTransaction');

// Module 5: Dynamic Storefront CMS, Promotions & Settings
const ShippingZone = require('./ShippingZone');
const Banner = require('./Banner');
const SpecialOfferCard = require('./SpecialOfferCard');
const Coupon = require('./Coupon');
const StoreFeature = require('./StoreFeature');
const ContactMessage = require('./ContactMessage');
const NewsletterSubscriber = require('./NewsletterSubscriber');
const StaticPage = require('./StaticPage');
const SiteSetting = require('./SiteSetting');

// --- ASSOCIATIONS ---

// 1. Admin Users & Relationships
AdminUser.hasMany(AdminOtp, { foreignKey: 'admin_id', as: 'otps', onDelete: 'CASCADE' });
AdminOtp.belongsTo(AdminUser, { foreignKey: 'admin_id', as: 'admin' });

AdminUser.hasMany(InventoryTransaction, { foreignKey: 'performed_by', as: 'inventory_transactions', onDelete: 'SET NULL' });
InventoryTransaction.belongsTo(AdminUser, { foreignKey: 'performed_by', as: 'performed_by_admin' });

AdminUser.hasMany(OrderTrackingLog, { foreignKey: 'updated_by', as: 'tracking_logs', onDelete: 'SET NULL' });
OrderTrackingLog.belongsTo(AdminUser, { foreignKey: 'updated_by', as: 'updated_by_admin' });

AdminUser.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'purchase_orders', onDelete: 'SET NULL' });
PurchaseOrder.belongsTo(AdminUser, { foreignKey: 'created_by', as: 'creator' });

AdminUser.hasMany(OrderReturn, { foreignKey: 'processed_by', as: 'processed_returns', onDelete: 'SET NULL' });
OrderReturn.belongsTo(AdminUser, { foreignKey: 'processed_by', as: 'processor' });

AdminUser.hasMany(FinancialTransaction, { foreignKey: 'recorded_by', as: 'financial_records', onDelete: 'SET NULL' });
FinancialTransaction.belongsTo(AdminUser, { foreignKey: 'recorded_by', as: 'recorder' });

// 2. Brand & Product
Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

// 3. Category Tree & Tag Rules
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });

Category.belongsToMany(Tag, { through: CategoryTag, foreignKey: 'category_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Category, { through: CategoryTag, foreignKey: 'tag_id', otherKey: 'category_id', as: 'categories' });

// 4. Product, Categories, Tags, Images & Reviews
Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id', otherKey: 'category_id', as: 'categories' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id', otherKey: 'product_id', as: 'products' });

Product.hasMany(ProductCategory, { foreignKey: 'product_id', as: 'product_categories' });
ProductCategory.belongsTo(Product, { foreignKey: 'product_id' });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Product.belongsToMany(Tag, { through: ProductTag, foreignKey: 'product_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Product, { through: ProductTag, foreignKey: 'tag_id', otherKey: 'product_id', as: 'products' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductReview, { foreignKey: 'product_id', as: 'reviews', onDelete: 'CASCADE' });
ProductReview.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 5. Bundles
Bundle.hasMany(BundleItem, { foreignKey: 'bundle_id', as: 'items', onDelete: 'CASCADE' });
BundleItem.belongsTo(Bundle, { foreignKey: 'bundle_id', as: 'bundle' });

BundleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(BundleItem, { foreignKey: 'product_id', as: 'bundle_inclusions' });

Bundle.belongsToMany(Product, { through: BundleItem, foreignKey: 'bundle_id', otherKey: 'product_id', as: 'products' });
Product.belongsToMany(Bundle, { through: BundleItem, foreignKey: 'product_id', otherKey: 'bundle_id', as: 'bundles' });

Bundle.belongsToMany(Category, { through: BundleCategory, foreignKey: 'bundle_id', otherKey: 'category_id', as: 'categories' });
Category.belongsToMany(Bundle, { through: BundleCategory, foreignKey: 'category_id', otherKey: 'bundle_id', as: 'bundles' });

// 6. ERP: Inventory Transactions & Products
Product.hasMany(InventoryTransaction, { foreignKey: 'product_id', as: 'inventory_transactions', onDelete: 'RESTRICT' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 7. ERP: Suppliers & Purchase Orders
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders', onDelete: 'RESTRICT' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id', as: 'po_items', onDelete: 'RESTRICT' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 8. Orders, Line Items, Tracking Logs & RMA
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Bundle.hasMany(OrderItem, { foreignKey: 'bundle_id', as: 'order_items', onDelete: 'SET NULL' });
OrderItem.belongsTo(Bundle, { foreignKey: 'bundle_id', as: 'bundle' });

Order.hasMany(OrderTrackingLog, { foreignKey: 'order_id', as: 'tracking_logs', onDelete: 'CASCADE' });
OrderTrackingLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Order.hasMany(OrderReturn, { foreignKey: 'order_id', as: 'returns', onDelete: 'CASCADE' });
OrderReturn.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderReturn.hasMany(OrderReturnItem, { foreignKey: 'rma_id', as: 'items', onDelete: 'CASCADE' });
OrderReturnItem.belongsTo(OrderReturn, { foreignKey: 'rma_id', as: 'return_request' });

OrderItem.hasMany(OrderReturnItem, { foreignKey: 'order_item_id', as: 'return_items', onDelete: 'CASCADE' });
OrderReturnItem.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'order_item' });

Product.hasMany(OrderReturnItem, { foreignKey: 'product_id', as: 'return_items', onDelete: 'RESTRICT' });
OrderReturnItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 9. ERP Financial Transactions
Order.hasMany(FinancialTransaction, { foreignKey: 'order_id', as: 'financial_transactions', onDelete: 'SET NULL' });
FinancialTransaction.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderReturn.hasMany(FinancialTransaction, { foreignKey: 'rma_id', as: 'financial_transactions', onDelete: 'SET NULL' });
FinancialTransaction.belongsTo(OrderReturn, { foreignKey: 'rma_id', as: 'return_record' });

PurchaseOrder.hasMany(FinancialTransaction, { foreignKey: 'po_id', as: 'financial_transactions', onDelete: 'SET NULL' });
FinancialTransaction.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

module.exports = {
  sequelize,
  AdminUser,
  AdminOtp,
  Brand,
  Category,
  Tag,
  CategoryTag,
  Product,
  ProductCategory,
  ProductTag,
  ProductImage,
  ProductReview,
  Bundle,
  BundleItem,
  BundleCategory,
  InventoryTransaction,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Order,
  OrderItem,
  OrderTrackingLog,
  OrderReturn,
  OrderReturnItem,
  FinancialTransaction,
  ShippingZone,
  Banner,
  SpecialOfferCard,
  Coupon,
  StoreFeature,
  ContactMessage,
  NewsletterSubscriber,
  StaticPage,
  SiteSetting,
};
