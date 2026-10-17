const { ShippingZone } = require('../models');

const egyptianGovernorates = [
  { ar: 'القاهرة', en: 'Cairo', cost: 45.00, daysAr: '1-2 أيام عمل', daysEn: '1-2 Business Days' },
  { ar: 'الجيزة', en: 'Giza', cost: 45.00, daysAr: '1-2 أيام عمل', daysEn: '1-2 Business Days' },
  { ar: 'الإسكندرية', en: 'Alexandria', cost: 55.00, daysAr: '2-3 أيام عمل', daysEn: '2-3 Business Days' },
  { ar: 'القليوبية', en: 'Qalyubia', cost: 50.00, daysAr: '2-3 أيام عمل', daysEn: '2-3 Business Days' },
  { ar: 'الشرقية', en: 'Al Sharqia', cost: 60.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'الدقهلية', en: 'Dakahlia', cost: 60.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'البحيرة', en: 'Beheira', cost: 60.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'الغربية', en: 'Gharbia', cost: 60.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'المنوفية', en: 'Monufia', cost: 60.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'كفر الشيخ', en: 'Kafr El Sheikh', cost: 65.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'دمياط', en: 'Damietta', cost: 65.00, daysAr: '2-4 أيام عمل', daysEn: '2-4 Business Days' },
  { ar: 'بورسعيد', en: 'Port Said', cost: 65.00, daysAr: '2-3 أيام عمل', daysEn: '2-3 Business Days' },
  { ar: 'الإسماعيلية', en: 'Ismailia', cost: 65.00, daysAr: '2-3 أيام عمل', daysEn: '2-3 Business Days' },
  { ar: 'السويس', en: 'Suez', cost: 65.00, daysAr: '2-3 أيام عمل', daysEn: '2-3 Business Days' },
  { ar: 'بني سويف', en: 'Beni Suef', cost: 70.00, daysAr: '3-4 أيام عمل', daysEn: '3-4 Business Days' },
  { ar: 'الفيوم', en: 'Faiyum', cost: 70.00, daysAr: '3-4 أيام عمل', daysEn: '3-4 Business Days' },
  { ar: 'المنيا', en: 'Minya', cost: 75.00, daysAr: '3-5 أيام عمل', daysEn: '3-5 Business Days' },
  { ar: 'أسيوط', en: 'Asyut', cost: 75.00, daysAr: '3-5 أيام عمل', daysEn: '3-5 Business Days' },
  { ar: 'سوهاج', en: 'Sohag', cost: 80.00, daysAr: '3-5 أيام عمل', daysEn: '3-5 Business Days' },
  { ar: 'قنا', en: 'Qena', cost: 85.00, daysAr: '4-6 أيام عمل', daysEn: '4-6 Business Days' },
  { ar: 'الأقصر', en: 'Luxor', cost: 85.00, daysAr: '4-6 أيام عمل', daysEn: '4-6 Business Days' },
  { ar: 'أسوان', en: 'Aswan', cost: 95.00, daysAr: '4-6 أيام عمل', daysEn: '4-6 Business Days' },
  { ar: 'البحر الأحمر', en: 'Red Sea', cost: 100.00, daysAr: '4-7 أيام عمل', daysEn: '4-7 Business Days' },
  { ar: 'جنوب سيناء', en: 'South Sinai', cost: 100.00, daysAr: '4-7 أيام عمل', daysEn: '4-7 Business Days' },
  { ar: 'شمال سيناء', en: 'North Sinai', cost: 110.00, daysAr: '4-7 أيام عمل', daysEn: '4-7 Business Days' },
  { ar: 'مطروح', en: 'Matrouh', cost: 95.00, daysAr: '4-7 أيام عمل', daysEn: '4-7 Business Days' },
  { ar: 'الوادي الجديد', en: 'New Valley', cost: 120.00, daysAr: '5-8 أيام عمل', daysEn: '5-8 Business Days' },
];

const seedShippingZones = async () => {
  for (const zone of egyptianGovernorates) {
    await ShippingZone.findOrCreate({
      where: { governorate_ar: zone.ar },
      defaults: {
        governorate_ar: zone.ar,
        governorate_en: zone.en,
        shipping_cost: zone.cost,
        estimated_days_ar: zone.daysAr,
        estimated_days_en: zone.daysEn,
        is_active: true,
      },
    });
  }
  console.log(` Seeded ${egyptianGovernorates.length} Egyptian Shipping Zones`);
};

module.exports = seedShippingZones;
