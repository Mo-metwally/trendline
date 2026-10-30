const { sequelize, Coupon, Order } = require('../src/models');

(async () => {
  try {
    await sequelize.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS name_ar VARCHAR(150);');
    await sequelize.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS name_en VARCHAR(150);');
    await sequelize.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1;');

    await sequelize.query(`
      UPDATE coupons
      SET name_ar = COALESCE(name_ar, 'كوبون ترحيب أول طلب 15%'),
          name_en = COALESCE(name_en, 'First Order Welcome 15%'),
          per_user_limit = COALESCE(per_user_limit, 1)
      WHERE code = 'FIRST15';
    `);

    const count = await Coupon.count();
    if (count <= 1) {
      await Coupon.findOrCreate({
        where: { code: 'TREND250' },
        defaults: {
          code: 'TREND250',
          name_ar: 'خصم باقات الشبكات والأنظمة 250 ج.م',
          name_en: 'Enterprise Networking 250 EGP Off',
          description_ar: 'خصم ثابت 250 ج.م على طلبات أجهزة الشبكات والأنظمة الأمنية',
          description_en: 'Fixed 250 EGP discount on networking & security orders',
          discount_type: 'fixed_amount',
          discount_value: 250.00,
          max_discount: null,
          min_order_value: 1500.00,
          first_order_only: false,
          usage_limit: 50,
          per_user_limit: 2,
          used_count: 2,
          expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          is_active: true,
        },
      });

      await Coupon.findOrCreate({
        where: { code: 'VIP20' },
        defaults: {
          code: 'VIP20',
          name_ar: 'كوبون عملاء الشركات والمؤسسات 20%',
          name_en: 'VIP Corporate Clients 20% Discount',
          description_ar: 'خصم 20% خاص لعملاء الشركات بحد أقصى 1000 ج.م',
          description_en: '20% discount for corporate orders up to 1000 EGP',
          discount_type: 'percentage',
          discount_value: 20.00,
          max_discount: 1000.00,
          min_order_value: 2000.00,
          first_order_only: false,
          usage_limit: 25,
          per_user_limit: 3,
          used_count: 1,
          expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          is_active: true,
        },
      });

      await Coupon.findOrCreate({
        where: { code: 'FLASH100' },
        defaults: {
          code: 'FLASH100',
          name_ar: 'عرض نهاية الأسبوع السريع 100 ج.م',
          name_en: 'Weekend Flash 100 EGP Off',
          description_ar: 'كوبون خصم فوري 100 ج.م لفترة محدودة',
          description_en: 'Instant 100 EGP off for a limited time',
          discount_type: 'fixed_amount',
          discount_value: 100.00,
          max_discount: null,
          min_order_value: 500.00,
          first_order_only: false,
          usage_limit: 10,
          per_user_limit: 1,
          used_count: 0,
          expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          is_active: false,
        },
      });
    }

    const oCount = await Order.count();
    if (oCount <= 1) {
      await Order.create({
        order_number: 'TRD-2610-7821',
        customer_name: 'أحمد محمود عبد الرحمن',
        customer_phone: '01098765432',
        customer_phone_2: '01122334455',
        customer_email: 'ahmed.mahmoud@example.com',
        governorate: 'القاهرة',
        city: 'مدينة نصر',
        street_address: 'شارع عباس العقاد - برج التكنولوجيا الدور الرابع',
        order_notes: 'يرجى الاتصال قبل الوصول بنصف ساعة',
        locale: 'ar',
        subtotal: 3200.00,
        discount_amount: 250.00,
        shipping_fee: 50.00,
        total_amount: 3000.00,
        total_cost: 2400.00,
        coupon_code: 'TREND250',
        payment_method: 'cod',
        payment_status: 'paid',
        order_status: 'confirmed',
      });

      await Order.create({
        order_number: 'TRD-2610-8914',
        customer_name: 'أحمد محمود عبد الرحمن',
        customer_phone: '01098765432',
        customer_email: 'ahmed.mahmoud@example.com',
        governorate: 'القاهرة',
        city: 'مدينة نصر',
        street_address: 'شارع عباس العقاد - برج التكنولوجيا الدور الرابع',
        locale: 'ar',
        subtotal: 2199.00,
        discount_amount: 250.00,
        shipping_fee: 50.00,
        total_amount: 1999.00,
        total_cost: 1650.00,
        coupon_code: 'TREND250',
        payment_method: 'instapay',
        payment_status: 'paid',
        order_status: 'shipped',
      });

      await Order.create({
        order_number: 'TRD-2610-9305',
        customer_name: 'م. كريم طارق الشناوي',
        customer_phone: '01223456789',
        customer_email: 'karim.tarek@company.eg',
        governorate: 'الجيزة',
        city: 'الشيخ زايد',
        street_address: 'الحي الأول - مجاورة 3 - فيلا 18',
        locale: 'ar',
        subtotal: 5400.00,
        discount_amount: 1000.00,
        shipping_fee: 65.00,
        total_amount: 4465.00,
        total_cost: 3800.00,
        coupon_code: 'VIP20',
        payment_method: 'cod',
        payment_status: 'unpaid',
        order_status: 'processing',
      });
    }

    console.log('Migration and coupon seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
