const crypto = require('crypto');
const {
  Cart,
  CartItem,
  Product,
  ProductImage,
  Brand,
  Bundle,
  BundleItem,
} = require('../models');

// Ensure tables exist on first usage
let syncedTables = false;
async function ensureTables() {
  if (!syncedTables) {
    try {
      await Cart.sync({ alter: false });
      await CartItem.sync({ alter: false });
      syncedTables = true;
    } catch (err) {
      console.warn('Cart tables sync warning:', err.message);
    }
  }
}

// Helper to extract or generate cart token
function resolveCartToken(req) {
  let token =
    req.headers['x-cart-token'] ||
    req.query.cart_token ||
    (req.body && req.body.cart_token);

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split('=');
      if (k === 'trendline_cart_token' && v) {
        token = decodeURIComponent(v);
        break;
      }
    }
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    token = 'crt_' + crypto.randomUUID().replace(/-/g, '');
  }

  return token.trim();
}

// Helper to fetch or create an active Cart
async function getOrCreateCart(req) {
  await ensureTables();
  const token = resolveCartToken(req);

  let [cart] = await Cart.findOrCreate({
    where: { cart_token: token, status: 'active' },
    defaults: { cart_token: token, status: 'active' },
  });

  return { cart, token };
}

// Helper to load fully-populated cart with totals
async function loadFullCart(cartId) {
  const cart = await Cart.findByPk(cartId, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['id', 'image_url', 'is_primary', 'sort_order'],
              },
              {
                model: Brand,
                as: 'brand',
                attributes: ['id', 'name_ar', 'name_en', 'slug'],
              },
            ],
          },
          {
            model: Bundle,
            as: 'bundle',
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: 'items' }, 'created_at', 'ASC']],
  });

  if (!cart) return null;

  let itemsCount = 0;
  let subtotal = 0;

  const formattedItems = (cart.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    let price = Number(item.unit_price) || 0;
    let originalPrice = price;
    let nameAr = '';
    let nameEn = '';
    let slug = '';
    let primaryImage = '/assets/placeholder-tech.png';
    let brandName = '';
    let maxStock = 999;
    let inStock = true;
    let sku = '';

    if (item.item_type === 'product' && item.product) {
      const prod = item.product;
      nameAr = prod.name_ar || prod.name || '';
      nameEn = prod.name_en || prod.name_ar || '';
      slug = prod.slug || prod.id;
      sku = prod.sku || '';

      const saleP = Number(prod.sale_price || 0);
      const origP = Number(prod.original_price || 0);
      price = saleP > 0 ? saleP : origP;
      originalPrice = origP > 0 ? origP : price;

      const avail = Math.max(0, (Number(prod.stock_quantity) || 0) - (Number(prod.reserved_stock) || 0));
      maxStock = avail;
      inStock = avail > 0;

      // Extract image
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        const primary = prod.images.find((i) => i.is_primary) || prod.images[0];
        primaryImage = primary?.image_url || primaryImage;
      } else if (prod.primary_image) {
        primaryImage = prod.primary_image;
      }

      if (prod.brand) {
        brandName = prod.brand.name_ar || prod.brand.name_en || '';
      }
    } else if (item.item_type === 'bundle' && item.bundle) {
      const b = item.bundle;
      nameAr = b.name_ar || b.name || '';
      nameEn = b.name_en || b.name_ar || '';
      slug = b.slug || b.id;
      price = Number(b.effective_bundle_price || b.original_price_sum || item.unit_price);
      originalPrice = Number(b.original_price_sum || price);
      primaryImage = b.banner_image || primaryImage;
    }

    const lineTotal = price * qty;
    itemsCount += qty;
    subtotal += lineTotal;

    return {
      id: item.id,
      cart_id: item.cart_id,
      item_type: item.item_type,
      product_id: item.product_id,
      bundle_id: item.bundle_id,
      quantity: qty,
      unit_price: price,
      original_price: originalPrice,
      line_total: lineTotal,
      name_ar: nameAr,
      name_en: nameEn,
      slug,
      sku,
      image: primaryImage,
      brand: brandName,
      max_stock: maxStock,
      in_stock: inStock,
      created_at: item.createdAt || item.created_at,
    };
  });

  return {
    id: cart.id,
    cart_token: cart.cart_token,
    status: cart.status,
    items: formattedItems,
    items_count: itemsCount,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

class CartController {
  /**
   * GET /api/v1/cart
   * Returns current active cart with all item details and calculations
   */
  async getCart(req, res) {
    try {
      const { cart, token } = await getOrCreateCart(req);
      const fullCart = await loadFullCart(cart.id);

      return res.status(200).json({
        success: true,
        cart_token: token,
        cart: fullCart || { id: cart.id, cart_token: token, items: [], items_count: 0, subtotal: 0 },
        items_count: fullCart?.items_count || 0,
        subtotal: fullCart?.subtotal || 0,
      });
    } catch (error) {
      console.error('CartController.getCart error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve cart',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/cart/items
   * Add a product or bundle to the cart
   */
  async addItem(req, res) {
    try {
      const { cart, token } = await getOrCreateCart(req);
      const {
        product_id,
        bundle_id,
        quantity = 1,
        item_type = 'product',
      } = req.body;

      const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

      if (item_type === 'product') {
        if (!product_id) {
          return res.status(400).json({ success: false, message: 'product_id is required' });
        }

        const product = await Product.findByPk(product_id);
        if (!product || !product.is_active) {
          return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
        }

        const availStock = Math.max(0, (Number(product.stock_quantity) || 0) - (Number(product.reserved_stock) || 0));
        if (availStock < 1) {
          return res.status(400).json({
            success: false,
            message: 'المنتج غير متوفر حالياً في المخزن',
            message_en: 'Product is currently out of stock',
          });
        }

        const unitPrice = product.sale_price ? Number(product.sale_price) : Number(product.original_price || 0);

        // Check if already in cart
        let existingItem = await CartItem.findOne({
          where: { cart_id: cart.id, product_id, item_type: 'product' },
        });

        if (existingItem) {
          const newQty = existingItem.quantity + qtyToAdd;
          if (newQty > availStock) {
            existingItem.quantity = availStock;
          } else {
            existingItem.quantity = newQty;
          }
          existingItem.unit_price = unitPrice;
          await existingItem.save();
        } else {
          const finalQty = Math.min(qtyToAdd, availStock);
          await CartItem.create({
            cart_id: cart.id,
            product_id,
            item_type: 'product',
            quantity: finalQty,
            unit_price: unitPrice,
          });
        }
      } else if (item_type === 'bundle') {
        if (!bundle_id) {
          return res.status(400).json({ success: false, message: 'bundle_id is required' });
        }
        const bundle = await Bundle.findByPk(bundle_id);
        if (!bundle || !bundle.is_active) {
          return res.status(404).json({ success: false, message: 'Bundle not found or unavailable' });
        }

        const unitPrice = Number(bundle.effective_bundle_price || bundle.original_price_sum || 0);

        let existingItem = await CartItem.findOne({
          where: { cart_id: cart.id, bundle_id, item_type: 'bundle' },
        });

        if (existingItem) {
          existingItem.quantity += qtyToAdd;
          existingItem.unit_price = unitPrice;
          await existingItem.save();
        } else {
          await CartItem.create({
            cart_id: cart.id,
            bundle_id,
            item_type: 'bundle',
            quantity: qtyToAdd,
            unit_price: unitPrice,
          });
        }
      }

      const fullCart = await loadFullCart(cart.id);

      return res.status(200).json({
        success: true,
        message: 'Item added to cart successfully',
        cart_token: token,
        cart: fullCart,
        items_count: fullCart?.items_count || 0,
        subtotal: fullCart?.subtotal || 0,
      });
    } catch (error) {
      console.error('CartController.addItem error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/v1/cart/items/:id
   * Update quantity of an item
   */
  async updateItem(req, res) {
    try {
      const { cart, token } = await getOrCreateCart(req);
      const itemId = req.params.id;
      const { quantity } = req.body;

      const newQty = parseInt(quantity, 10);

      const cartItem = await CartItem.findOne({
        where: { id: itemId, cart_id: cart.id },
      });

      if (!cartItem) {
        return res.status(404).json({ success: false, message: 'Item not found in cart' });
      }

      if (isNaN(newQty) || newQty <= 0) {
        await cartItem.destroy();
      } else {
        // Check stock if product
        if (cartItem.item_type === 'product' && cartItem.product_id) {
          const product = await Product.findByPk(cartItem.product_id);
          if (product) {
            const availStock = Math.max(0, (Number(product.stock_quantity) || 0) - (Number(product.reserved_stock) || 0));
            cartItem.quantity = Math.min(newQty, Math.max(1, availStock));
            if (product.sale_price) {
              cartItem.unit_price = Number(product.sale_price);
            }
          } else {
            cartItem.quantity = newQty;
          }
        } else {
          cartItem.quantity = newQty;
        }

        await cartItem.save();
      }

      const fullCart = await loadFullCart(cart.id);

      return res.status(200).json({
        success: true,
        message: 'Cart item updated',
        cart_token: token,
        cart: fullCart,
        items_count: fullCart?.items_count || 0,
        subtotal: fullCart?.subtotal || 0,
      });
    } catch (error) {
      console.error('CartController.updateItem error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/v1/cart/items/:id
   * Remove a single item from the cart
   */
  async removeItem(req, res) {
    try {
      const { cart, token } = await getOrCreateCart(req);
      const itemId = req.params.id;

      await CartItem.destroy({
        where: { id: itemId, cart_id: cart.id },
      });

      const fullCart = await loadFullCart(cart.id);

      return res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        cart_token: token,
        cart: fullCart,
        items_count: fullCart?.items_count || 0,
        subtotal: fullCart?.subtotal || 0,
      });
    } catch (error) {
      console.error('CartController.removeItem error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove item',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/v1/cart
   * Clear all items in active cart
   */
  async clearCart(req, res) {
    try {
      const { cart, token } = await getOrCreateCart(req);

      await CartItem.destroy({
        where: { cart_id: cart.id },
      });

      const fullCart = await loadFullCart(cart.id);

      return res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
        cart_token: token,
        cart: fullCart,
        items_count: 0,
        subtotal: 0,
      });
    } catch (error) {
      console.error('CartController.clearCart error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error.message,
      });
    }
  }
}

module.exports = new CartController();
