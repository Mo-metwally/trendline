const { sequelize } = require('../config/db');
const {
  Banner,
  Category,
  Product,
  ProductCategory,
  ProductImage,
} = require('../models');

async function seedStorefront() {
  try {
    await sequelize.authenticate();
    console.log('Database connected for storefront seeding...');

    // 1. Seed Banners if empty
    const bannerCount = await Banner.count();
    if (bannerCount === 0) {
      console.log('Seeding initial hero slider banners...');
      await Banner.bulkCreate([
        {
          placement: 'hero_vertical_slider',
          title_ar: 'سجل الآن واحصل علي مزايا حصرية',
          title_en: 'Register Now & Get Exclusive Perks',
          subtitle_ar: 'تخفيضات • عروض • نقاط • أسرع',
          subtitle_en: 'Discounts • Offers • Points • Faster',
          badge_text_ar: 'عضوية ترندلاين',
          badge_text_en: 'Trendline Member',
          image_url: '/assets/banner-member.png',
          bg_style: 'card-primary-cta',
          button_text_ar: 'تسوق الآن',
          button_text_en: 'Shop Now',
          target_url: '/register',
          highlights_json: [
            { icon: 'truck', text: 'شحن مجاني للطلبات' },
            { icon: 'percent', text: 'خصومات مميزة' },
            { icon: 'shield', text: 'دفع آمن عند الاستلام' },
            { icon: 'repeat', text: 'إرجاع مجاني خلال 14 يوم' },
          ],
          sort_order: 1,
          is_active: true,
        },
        {
          placement: 'hero_vertical_slider',
          title_ar: 'أجهزة لابتوب وإكسسواراتها',
          title_en: 'Laptops & Computer Accessories',
          subtitle_ar: 'أداء أعلى... لكل احتياجاتك',
          subtitle_en: 'Top Performance for Every Need',
          badge_text_ar: 'أحدث الموديلات',
          badge_text_en: 'Latest Models',
          image_url: 'https://images.trendlineeg.com/products/laptop-hero.png',
          bg_style: 'card-white-glass',
          button_text_ar: 'تسوق الآن',
          button_text_en: 'Shop Now',
          target_url: '/categories/accessories',
          sort_order: 2,
          is_active: true,
        },
        {
          placement: 'hero_vertical_slider',
          title_ar: 'وفر أكتر مع البنك الأهلي',
          title_en: 'Save More with NBE Bank',
          subtitle_ar: 'خصم حتى 10% عند الدفع ببطاقات البنك الأهلي',
          subtitle_en: 'Up to 10% Off with National Bank of Egypt',
          badge_text_ar: '10% OFF',
          badge_text_en: '10% OFF',
          image_url: 'https://images.trendlineeg.com/products/nbe-card.png',
          bg_style: 'card-bank-promo',
          button_text_ar: 'تسوق الآن',
          button_text_en: 'Shop Now',
          target_url: '/deals',
          sort_order: 3,
          is_active: true,
        },
        {
          placement: 'hero_vertical_slider',
          title_ar: 'عروض محدودة الوقت',
          title_en: 'Limited-Time Tech Deals',
          subtitle_ar: 'خصم 1,000 جنية على الأجهزة والمعدات',
          subtitle_en: 'EGP 1,000 Off on Cleaning Devices',
          badge_text_ar: 'لفترة محدودة',
          badge_text_en: 'Limited Time',
          image_url: 'https://images.trendlineeg.com/products/vacuum-hero.png',
          bg_style: 'card-white-glass',
          button_text_ar: 'تسوق الآن',
          button_text_en: 'Shop Now',
          target_url: '/deals',
          sort_order: 4,
          is_active: true,
        },
        {
          placement: 'hero_vertical_slider',
          title_ar: 'أنظمة المراقبة الذكية',
          title_en: 'Smart Security Surveillance',
          subtitle_ar: 'حماية متكاملة لمنزلك ومكتبك بأعلى دقة 4K',
          subtitle_en: 'Protect Your Home & Workspace with 4K',
          badge_text_ar: 'أمان متكامل',
          badge_text_en: 'Full Security',
          image_url: 'https://images.trendlineeg.com/products/cctv-hero.png',
          bg_style: 'card-white-glass',
          button_text_ar: 'تسوق الآن',
          button_text_en: 'Shop Now',
          target_url: '/categories/surveillance',
          sort_order: 5,
          is_active: true,
        },
      ]);
      console.log('Hero slider banners seeded successfully!');
    }

    // 2. Ensure Home Grid Categories & 4 Products Each
    const sampleCategories = [
      {
        name_ar: 'الراوترات',
        name_en: 'Routers',
        slug: 'routers',
        starting_price: '650.00',
        sort_order: 1,
        show_in_home_grid: true,
        icon_url: '/icons/router.svg',
        products: [
          { name_ar: 'راوتر منزلي', name_en: 'Home Router', price: '1350.00', sku: 'RTR-HOME-01', img: 'https://images.trendlineeg.com/products/rtr-home.png' },
          { name_ar: 'لوحة مفاتيح', name_en: 'Keyboard', price: '650.00', sku: 'KB-01', img: 'https://images.trendlineeg.com/products/keyboard.png' },
          { name_ar: 'راوتر 5G', name_en: '5G Router Ultra', price: '6990.00', sku: 'RTR-5G-01', img: 'https://images.trendlineeg.com/products/rtr-5g.png' },
          { name_ar: 'شاشات عرض', name_en: 'Monitors', price: '4200.00', sku: 'MON-01', img: 'https://images.trendlineeg.com/products/monitor.png' },
        ],
      },
      {
        name_ar: 'إكسسوارات كمبيوتر',
        name_en: 'Computer Accessories',
        slug: 'accessories',
        starting_price: '450.00',
        sort_order: 2,
        show_in_home_grid: true,
        icon_url: '/icons/mouse.svg',
        products: [
          { name_ar: 'ماوس لاسلكي', name_en: 'Wireless Mouse', price: '450.00', sku: 'MS-W-01', img: 'https://images.trendlineeg.com/products/mouse.png' },
          { name_ar: 'لوحة مفاتيح ميكانيكية', name_en: 'Mechanical Keyboard', price: '650.00', sku: 'KB-M-01', img: 'https://images.trendlineeg.com/products/keyboard.png' },
          { name_ar: 'لابتوب للأعمال', name_en: 'Business Laptop Pro', price: '28999.00', sku: 'LP-BIZ-01', img: 'https://images.trendlineeg.com/products/laptop.png' },
          { name_ar: 'لابتوب للألعاب', name_en: 'Gaming Laptop RTX', price: '32500.00', sku: 'LP-GAME-01', img: 'https://images.trendlineeg.com/products/laptop.png' },
        ],
      },
      {
        name_ar: 'أجهزة الشبكات',
        name_en: 'Networking Devices',
        slug: 'networking-devices',
        starting_price: '450.00',
        sort_order: 3,
        show_in_home_grid: true,
        icon_url: '/icons/switch.svg',
        products: [
          { name_ar: 'سويتشات جيجابت', name_en: 'Gigabit Switch 8-Port', price: '1450.00', sku: 'SW-8P-01', img: 'https://images.trendlineeg.com/products/switch.png' },
          { name_ar: 'راوترات متقدمة', name_en: 'Enterprise Router', price: '2499.00', sku: 'RTR-ENT-01', img: 'https://images.trendlineeg.com/products/rtr-home.png' },
          { name_ar: 'نقاط وصول سقفية', name_en: 'Ceiling Access Point', price: '1150.00', sku: 'AP-CEIL-01', img: 'https://images.trendlineeg.com/products/ap.png' },
          { name_ar: 'كابلات الشبكة Cat6', name_en: 'Cat6 Network Cable 305m', price: '450.00', sku: 'CBL-C6-01', img: 'https://images.trendlineeg.com/products/cable.png' },
        ],
      },
      {
        name_ar: 'كاميرات المراقبة',
        name_en: 'CCTV & Surveillance',
        slug: 'cctv-surveillance',
        starting_price: '1250.00',
        sort_order: 4,
        show_in_home_grid: true,
        icon_url: '/icons/camera.svg',
        products: [
          { name_ar: 'كاميرا داخلية بدقة 4K', name_en: 'Indoor 4K Camera', price: '1250.00', sku: 'CAM-IN-01', img: 'https://images.trendlineeg.com/products/cam-in.png' },
          { name_ar: 'كاميرا خارجية مقاومة للعوامل', name_en: 'Outdoor Weatherproof Camera', price: '2750.00', sku: 'CAM-OUT-01', img: 'https://images.trendlineeg.com/products/cam-out.png' },
          { name_ar: 'كاميرا PTZ متحركة', name_en: 'PTZ 360 Camera', price: '4990.00', sku: 'CAM-PTZ-01', img: 'https://images.trendlineeg.com/products/cam-ptz.png' },
          { name_ar: 'كاميرا لاسلكية واي فاي', name_en: 'WiFi Solar Camera', price: '1850.00', sku: 'CAM-WF-01', img: 'https://images.trendlineeg.com/products/cam-wf.png' },
        ],
      },
      {
        name_ar: 'أنظمة الأمان والمراقبة',
        name_en: 'Security & Access Systems',
        slug: 'security-systems',
        starting_price: '1250.00',
        sort_order: 5,
        show_in_home_grid: true,
        icon_url: '/icons/security.svg',
        products: [
          { name_ar: 'أجهزة التسجيل NVR', name_en: 'NVR 16-Channel 4K', price: '2450.00', sku: 'NVR-16-01', img: 'https://images.trendlineeg.com/products/nvr.png' },
          { name_ar: 'كاميرات مراقبة ليلية', name_en: 'ColorVu Night Camera', price: '1250.00', sku: 'CAM-VU-01', img: 'https://images.trendlineeg.com/products/cam-vu.png' },
          { name_ar: 'أجهزة الإنذار والحماية', name_en: 'Smart Alarm Hub', price: '3680.00', sku: 'ALM-HUB-01', img: 'https://images.trendlineeg.com/products/alarm.png' },
          { name_ar: 'أقفال ذكية ببصمة الأصبع', name_en: 'Smart Biometric Lock', price: '3200.00', sku: 'LCK-BIO-01', img: 'https://images.trendlineeg.com/products/lock.png' },
        ],
      },
    ];

    for (const catData of sampleCategories) {
      let [category] = await Category.findOrCreate({
        where: { slug: catData.slug },
        defaults: {
          name_ar: catData.name_ar,
          name_en: catData.name_en,
          slug: catData.slug,
          starting_price: catData.starting_price,
          sort_order: catData.sort_order,
          show_in_home_grid: catData.show_in_home_grid,
          icon_url: catData.icon_url,
          is_active: true,
        },
      });

      // Ensure show_in_home_grid and starting_price are updated
      await category.update({
        show_in_home_grid: true,
        sort_order: catData.sort_order,
        starting_price: catData.starting_price,
      });

      // Add 4 sample products
      for (const pData of catData.products) {
        const [product] = await Product.findOrCreate({
          where: { sku: pData.sku },
          defaults: {
            name_ar: pData.name_ar,
            name_en: pData.name_en,
            slug: `${catData.slug}-${pData.sku.toLowerCase()}`,
            sku: pData.sku,
            cost_price: (parseFloat(pData.price) * 0.75).toFixed(2),
            original_price: (parseFloat(pData.price) * 1.15).toFixed(2),
            sale_price: pData.price,
            stock_quantity: 50,
            is_active: true,
          },
        });

        // Link product to category
        await ProductCategory.findOrCreate({
          where: { product_id: product.id, category_id: category.id },
          defaults: { is_primary: true, is_auto_assigned: false },
        });

        // Create product image
        await ProductImage.findOrCreate({
          where: { product_id: product.id, image_url: pData.img },
          defaults: {
            is_primary: true,
            sort_order: 0,
            alt_text_ar: pData.name_ar,
            alt_text_en: pData.name_en,
          },
        });
      }
    }

    console.log('Categories and products seeded for storefront grid successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Storefront seeding failed:', err);
    process.exit(1);
  }
}

seedStorefront();
