const {
  SiteSetting,
  Coupon,
  StoreFeature,
  Brand,
  Category,
  Tag,
  CategoryTag,
} = require('../models');

const seedInitialData = async () => {
  // 1. Site Settings
  const settings = [
    {
      key: 'site_name',
      ar: 'ترندلاين تك للأجهزة والحلول التقنية',
      en: 'Trendline Tech Hardware & IT Solutions',
      common: null,
      group: 'general',
    },
    {
      key: 'contact_phone',
      ar: null,
      en: null,
      common: '+201009770207',
      group: 'contact',
    },
    {
      key: 'contact_email',
      ar: null,
      en: null,
      common: 'info@trendlineeg.com',
      group: 'contact',
    },
    {
      key: 'contact_address',
      ar: 'القاهرة، مصر',
      en: 'Cairo, Egypt',
      common: null,
      group: 'contact',
    },
    {
      key: 'free_shipping_threshold',
      ar: null,
      en: null,
      common: '2500',
      group: 'shipping',
    },
  ];

  for (const s of settings) {
    await SiteSetting.findOrCreate({
      where: { setting_key: s.key },
      defaults: {
        setting_key: s.key,
        setting_value_ar: s.ar,
        setting_value_en: s.en,
        setting_value_common: s.common,
        setting_group: s.group,
      },
    });
  }

  // 2. Default First-Order Coupon
  await Coupon.findOrCreate({
    where: { code: 'FIRST15' },
    defaults: {
      code: 'FIRST15',
      description_ar: 'خصم 15% على أول طلب لجميع العملاء الجدد',
      description_en: '15% Off Your First Order for New Customers',
      discount_type: 'percentage',
      discount_value: 15.00,
      max_discount: 500.00,
      min_order_value: 500.00,
      first_order_only: true,
      usage_limit: 10000,
      is_active: true,
    },
  });

  // 3. Store Features
  const features = [
    {
      placement: 'middle_features_strip',
      title_ar: 'ضمان معتمد 100%',
      title_en: '100% Genuine Warranty',
      subtitle_ar: 'منتجات أصلية معتمدة من الوكلاء الرسميين',
      subtitle_en: 'Directly from official authorized distributors',
      icon_url: '/icons/shield-check.svg',
      sort_order: 1,
    },
    {
      placement: 'middle_features_strip',
      title_ar: 'شحن سريع لكافة المحافظات',
      title_en: 'Fast Nationwide Delivery',
      subtitle_ar: 'توصيل آمن لباب البيت في 24-48 ساعة',
      subtitle_en: 'Safe delivery to your doorstep in 24-48 hours',
      icon_url: '/icons/truck.svg',
      sort_order: 2,
    },
    {
      placement: 'middle_features_strip',
      title_ar: 'دعم فني واستشارات مجانية',
      title_en: 'Free Technical Support',
      subtitle_ar: 'فريق مهندسين متخصص لمساعدتك قبل وبعد الشراء',
      subtitle_en: 'Specialized engineers to guide you 24/7',
      icon_url: '/icons/headphones.svg',
      sort_order: 3,
    },
    {
      placement: 'middle_features_strip',
      title_ar: 'إرجاع سهل خلال 14 يوماً',
      title_en: '14-Day Easy Returns',
      subtitle_ar: 'سياسة إرجاع مرنة وسريعة لحمايتك بالكامل',
      subtitle_en: 'Hassle-free return policy ensuring total peace of mind',
      icon_url: '/icons/refresh-cw.svg',
      sort_order: 4,
    },
  ];

  for (const f of features) {
    await StoreFeature.findOrCreate({
      where: { title_ar: f.title_ar, placement: f.placement },
      defaults: f,
    });
  }

  // 4. Initial Brands
  const brands = [
    { name_ar: 'تي بي-لينك', name_en: 'TP-Link', slug: 'tp-link', logo_url: '/brands/tp-link.png', is_featured: true, sort_order: 1 },
    { name_ar: 'هايكفيجن', name_en: 'Hikvision', slug: 'hikvision', logo_url: '/brands/hikvision.png', is_featured: true, sort_order: 2 },
    { name_ar: 'أسوس', name_en: 'ASUS', slug: 'asus', logo_url: '/brands/asus.png', is_featured: true, sort_order: 3 },
    { name_ar: 'ديل', name_en: 'Dell', slug: 'dell', logo_url: '/brands/dell.png', is_featured: true, sort_order: 4 },
  ];

  for (const b of brands) {
    await Brand.findOrCreate({
      where: { slug: b.slug },
      defaults: b,
    });
  }

  // 5. Initial Tags & Categories for Hybrid Tagging
  const tags = [
    { name_ar: 'راوترات', name_en: 'Routers', slug: 'routers' },
    { name_ar: 'سويتشات', name_en: 'Switches', slug: 'switches' },
    { name_ar: 'كاميرات مراقبة', name_en: 'CCTV Cameras', slug: 'cctv-cameras' },
    { name_ar: 'أجهزة NVR', name_en: 'NVR Recorders', slug: 'nvr-recorders' },
    { name_ar: 'واي فاي 6', name_en: 'WiFi 6', slug: 'wifi-6' },
  ];

  const createdTags = {};
  for (const t of tags) {
    const [tag] = await Tag.findOrCreate({
      where: { slug: t.slug },
      defaults: t,
    });
    createdTags[t.slug] = tag;
  }

  const [catNetworking] = await Category.findOrCreate({
    where: { slug: 'networking' },
    defaults: {
      name_ar: 'أجهزة الشبكات والواي فاي',
      name_en: 'Networking & WiFi',
      slug: 'networking',
      icon_url: '/icons/wifi.svg',
      starting_price: 650.00,
      show_in_home_grid: true,
      sort_order: 1,
    },
  });

  const [catSurveillance] = await Category.findOrCreate({
    where: { slug: 'surveillance' },
    defaults: {
      name_ar: 'أنظمة الأمان والمراقبة',
      name_en: 'Security & Surveillance',
      slug: 'surveillance',
      icon_url: '/icons/camera.svg',
      starting_price: 950.00,
      show_in_home_grid: true,
      sort_order: 2,
    },
  });

  // Map category tags
  if (createdTags['routers']) {
    await CategoryTag.findOrCreate({
      where: { category_id: catNetworking.id, tag_id: createdTags['routers'].id },
      defaults: { category_id: catNetworking.id, tag_id: createdTags['routers'].id },
    });
  }

  if (createdTags['cctv-cameras']) {
    await CategoryTag.findOrCreate({
      where: { category_id: catSurveillance.id, tag_id: createdTags['cctv-cameras'].id },
      defaults: { category_id: catSurveillance.id, tag_id: createdTags['cctv-cameras'].id },
    });
  }

  console.log(' Seeded default site settings, coupons, store features, brands, and categories.');
};

module.exports = seedInitialData;
