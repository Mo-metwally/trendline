const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  sequelize,
  Brand,
  Category,
  Tag,
  Product,
  ProductCategory,
  ProductTag,
  ProductImage,
  Bundle,
} = require('../src/models');
const { generateProductId } = require('../src/utils/idGenerator');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to download a real image URL to public/uploads/products/<filename>
function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
      return resolve(true);
    }
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        timeout: 12000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadImage(res.headers.location, destPath).then(resolve);
        }
        if (res.statusCode !== 200) {
          return resolve(false);
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
        fileStream.on('error', () => resolve(false));
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// High-resolution verified real product photography URLs
const IMAGE_SOURCES = {
  'router-gaming-gt-ax6000.jpg':
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=85',
  'router-mesh-deco-xe75.jpg':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=85',
  'switch-poe-16port.jpg':
    'https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&w=900&q=85',
  'unifi-u6-pro-ap.jpg':
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=900&q=85',
  'hikvision-4k-colorvu.jpg':
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=85',
  'tapo-c520ws-ptz.jpg':
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=85',
  'hikvision-nvr-16ch.jpg':
    'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=900&q=85',
  'hikvision-face-terminal.jpg':
    'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=85',
  'logitech-mx-master-3s.jpg':
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=85',
  'asus-rog-azoth-kb.jpg':
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
  'hyperx-cloud-iii.jpg':
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=85',
  'sony-wh1000xm5.jpg':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  'roborock-s8-pro-ultra.jpg':
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=85',
  'dyson-v15-detect.jpg':
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=85',
  'xiaomi-air-purifier-4pro.jpg':
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=85',
  'philips-airfryer-xl.jpg':
    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=85',
  'laptop-pro-workstation.jpg':
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
  'monitor-4k-ultrawide.jpg':
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85',
};

(async () => {
  try {
    console.log('1. Downloading real product images into public/uploads/products/ ...');
    const localUrlMap = {};
    for (const [fileName, remoteUrl] of Object.entries(IMAGE_SOURCES)) {
      const dest = path.join(UPLOAD_DIR, fileName);
      const ok = await downloadImage(remoteUrl, dest);
      localUrlMap[fileName] = ok ? `/uploads/products/${fileName}` : remoteUrl;
    }

    // 2. Ensure Real Global Tech Brands exist
    const brandsToEnsure = [
      { name_ar: 'لوجيتك', name_en: 'Logitech', slug: 'logitech' },
      { name_ar: 'سوني', name_en: 'Sony', slug: 'sony' },
      { name_ar: 'هايبر إكس', name_en: 'HyperX', slug: 'hyperx' },
      { name_ar: 'يوبيكويتي', name_en: 'Ubiquiti', slug: 'ubiquiti' },
      { name_ar: 'روبوروك', name_en: 'Roborock', slug: 'roborock' },
      { name_ar: 'دايسون', name_en: 'Dyson', slug: 'dyson' },
      { name_ar: 'شاومي', name_en: 'Xiaomi', slug: 'xiaomi' },
      { name_ar: 'فيليبس', name_en: 'Philips', slug: 'philips' },
    ];

    const brandMap = {};
    const allExistingBrands = await Brand.findAll();
    allExistingBrands.forEach((b) => {
      brandMap[b.slug] = b.id;
    });

    for (const bInfo of brandsToEnsure) {
      if (!brandMap[bInfo.slug]) {
        const created = await Brand.create({
          name_ar: bInfo.name_ar,
          name_en: bInfo.name_en,
          slug: bInfo.slug,
          logo_url: `/uploads/products/router-gaming-gt-ax6000.jpg`,
          is_active: true,
        });
        brandMap[bInfo.slug] = created.id;
      }
    }

    // 3. Fix any broken dummy images (images.trendlineeg.com) on existing products & bundles
    const existingImages = await ProductImage.findAll();
    for (const img of existingImages) {
      const u = String(img.image_url || '');
      if (u.includes('images.trendlineeg.com')) {
        let replacement = localUrlMap['router-gaming-gt-ax6000.jpg'];
        if (u.includes('keyboard')) replacement = localUrlMap['asus-rog-azoth-kb.jpg'];
        else if (u.includes('mouse')) replacement = localUrlMap['logitech-mx-master-3s.jpg'];
        else if (u.includes('monitor')) replacement = localUrlMap['monitor-4k-ultrawide.jpg'];
        else if (u.includes('laptop')) replacement = localUrlMap['laptop-pro-workstation.jpg'];
        else if (u.includes('switch')) replacement = localUrlMap['switch-poe-16port.jpg'];
        else if (u.includes('cam') || u.includes('cctv')) replacement = localUrlMap['hikvision-4k-colorvu.jpg'];
        else if (u.includes('lock') || u.includes('sec')) replacement = localUrlMap['hikvision-face-terminal.jpg'];
        else if (u.includes('nvr')) replacement = localUrlMap['hikvision-nvr-16ch.jpg'];
        await img.update({ image_url: replacement });
      }
    }

    const existingBundles = await Bundle.findAll();
    for (const bnd of existingBundles) {
      if (String(bnd.image_url || '').includes('images.trendlineeg.com')) {
        await bnd.update({ image_url: localUrlMap['router-gaming-gt-ax6000.jpg'] });
      }
    }

    // 4. Seed 16 Real Detailed Products Across All Categories & Subcategories
    const newProducts = [
      // --- Category: Routers (c) & Networking (a) ---
      {
        sku: 'ASUS-GT-AX6000',
        barcode: '4711081463504',
        slug: 'asus-rog-rapture-gt-ax6000-wifi6-gaming-router',
        brand_slug: 'asus',
        name_ar: 'راوتر الألعاب الاحترافي أسوس ROG Rapture GT-AX6000 ثنائي النطاق واي فاي 6',
        name_en: 'ASUS ROG Rapture GT-AX6000 Dual-Band WiFi 6 Gaming Router',
        short_desc_ar: 'راوتر ألعاب فائق السرعة AX6000 بمعالج رباعي النواة 2.0GHz ومنفذين 2.5G المزدوجين وإضاءة Aura RGB.',
        short_desc_en: 'High-efficiency Dual-Band WiFi 6 Gaming Router AX6000 with dual 2.5G ports and 2.0GHz Quad-Core CPU.',
        description_ar:
          'يوفر راوتر الألعاب الاحترافي ASUS ROG Rapture GT-AX6000 سرعات اتصال لاسلكية تصل إلى 6000 ميجابت/ثانية مع تقنية RangeBoost Plus التي توسع مدى التغطية بنسبة 38%. مزود بمعالج Broadcom رباعي النواة بتردد 2.0 جيجاهرتز وذاكرة عشوائية 1 جيجابايت، بالإضافة إلى منفذي 2.5G WAN/LAN فائقي السرعة وتقنية تسريع الألعاب ثلاثية المستويات وحماية AiProtection Pro المجانية مدى الحياة.',
        description_en:
          'The ROG Rapture GT-AX6000 Dual-Band WiFi 6 gaming router delivers ultrafast speeds up to 6000 Mbps, dual 2.5G ports, Triple-Level Game Acceleration, and ASUS RangeBoost Plus.',
        cost_price: 11800,
        original_price: 16500,
        sale_price: 14499,
        discount_percent: 12,
        stock_quantity: 18,
        is_featured: true,
        categories: ['c', 'a'],
        tags: ['1', '5'],
        images: [localUrlMap['router-gaming-gt-ax6000.jpg'], localUrlMap['router-mesh-deco-xe75.jpg']],
        specifications: {
          'الموديل': 'ROG Rapture GT-AX6000',
          'معيار الشبكة اللاسلكية': 'Wi-Fi 6 (802.11ax) Dual-Band AX6000',
          'السرعة اللاسلكية': '4804 Mbps (5GHz) + 1148 Mbps (2.4GHz)',
          'المعالج والذاكرة': '2.0 GHz Quad-Core 64-bit CPU / 1GB RAM / 256MB Flash',
          'المنافذ السلكية': '2 × 2.5G WAN/LAN + 4 × Gigabit LAN + USB 3.2 Gen 1',
          'الهوائيات': '4 هوائيات خارجية عالية الكسب قابلة للفصل',
          'أنظمة الحماية والألعاب': 'AiProtection Pro + Triple-Level Game Acceleration + ASUS Aura RGB',
        },
      },
      {
        sku: 'TPL-DECO-XE75-2PK',
        barcode: '4897098687550',
        slug: 'tp-link-deco-xe75-axe5400-tri-band-mesh-wifi-6e-2pack',
        brand_slug: 'tp-link',
        name_ar: 'نظام ميش واي فاي 6E تي بي-لينك ديكو XE75 ثلاثي النطاق AXE5400 (قطعتين)',
        name_en: 'TP-Link Deco XE75 AXE5400 Tri-Band Mesh Wi-Fi 6E System (2-Pack)',
        short_desc_ar: 'نظام شبكة منزلية ومكتبية متكامل يدعم تردد 6GHz الجديد كلياً بسرعة 5400 ميجابت وتغطية حتى 510 متر مربع.',
        short_desc_en: 'Whole Home Tri-Band Mesh Wi-Fi 6E System AXE5400 with brand-new 6 GHz band covering up to 5,500 sq.ft.',
        description_ar:
          'ارتقِ بشبكتك اللاسلكية إلى الجيل الأحدث مع نظام TP-Link Deco XE75 الداعم لتقنية Wi-Fi 6E ثلاثية النطاق (6GHz + 5GHz + 2.4GHz) بسرعة إجمالية تصل إلى 5400 ميجابت/ثانية. يعتمد على الذكاء الاصطناعي AI-Driven Mesh للتنقل السلس بين الغرف والطوابق باسم شبكة واحدة، ويدعم اتصال أكثر من 200 جهاز في وقت واحد دون أي تقطيع.',
        description_en:
          'TP-Link Deco XE75 brings the 6 GHz band to Mesh WiFi with AXE5400 tri-band speeds, AI-Driven Mesh roaming, and 3 Gigabit ports per unit.',
        cost_price: 8900,
        original_price: 12200,
        sale_price: 10850,
        discount_percent: 11,
        stock_quantity: 24,
        is_featured: true,
        categories: ['c', 'a'],
        tags: ['1', '5'],
        images: [localUrlMap['router-mesh-deco-xe75.jpg'], localUrlMap['router-gaming-gt-ax6000.jpg']],
        specifications: {
          'الموديل': 'Deco XE75 (2-Pack)',
          'تقنية الواي فاي': 'Tri-Band Wi-Fi 6E (AXE5400)',
          'توزيع السرعات': '6GHz (2402 Mbps) + 5GHz (2402 Mbps) + 2.4GHz (574 Mbps)',
          'المعالج': '1.7 GHz Quad-Core CPU',
          'مساحة التغطية': 'تصل إلى 510 متر مربع (5,500 قدم مربع) للقطعتين',
          'المنافذ لكل وحدة': '3 منافذ Gigabit WAN/LAN باستشعار تلقائي',
          'سعة الأجهزة المتصلة': 'أكثر من 200 جهاز متصل في آن واحد + حماية HomeShield',
        },
      },

      // --- Category: Networking Devices (e) & Networking (a) ---
      {
        sku: 'TPL-TL-SG1016PE',
        barcode: '6935364082666',
        slug: 'tp-link-tl-sg1016pe-16-port-gigabit-easy-smart-poe-switch',
        brand_slug: 'tp-link',
        name_ar: 'سويتش شبكات ذكي تي بي-لينك 16 منفذ جيجابت مع 8 منافذ PoE+ بقدرة 150 وات',
        name_en: 'TP-Link TL-SG1016PE 16-Port Gigabit Easy Smart PoE+ Switch',
        short_desc_ar: 'سويتش مؤسسي معدني 16 منفذ جيجابت يدعم تغذية الكاميرات والأكسس بوينت بالطاقة PoE+ حتى 150 وات.',
        short_desc_en: '16-Port Gigabit Easy Smart Switch with 8-Port PoE+ (150W budget), VLAN, QoS, and rackmount metal housing.',
        description_ar:
          'يُعد السويتش الاحترافي TP-Link TL-SG1016PE الحل المثالي للشركات وأنظمة المراقبة الشبكية، حيث يضم 16 منفذ جيجابت RJ45 منها 8 منافذ تدعم معيار 802.11af/at PoE+ بميزانية طاقة إجمالية 150 وات وبحد أقصى 30 وات للمنفذ الواحد. يدعم إدارة الشبكة الذكية وتقسيم VLAN وجودة الخدمة QoS ومراقبة الكابلات.',
        description_en:
          'TP-Link TL-SG1016PE features 16 Gigabit RJ45 ports including 8 PoE+ ports with a 150W total power budget, intelligent power management, VLAN, and QoS.',
        cost_price: 4200,
        original_price: 5900,
        sale_price: 5250,
        discount_percent: 11,
        stock_quantity: 30,
        is_featured: false,
        categories: ['e', 'a'],
        tags: ['2'],
        images: [localUrlMap['switch-poe-16port.jpg']],
        specifications: {
          'الموديل': 'TL-SG1016PE V3',
          'عدد المنافذ': '16 منفذ 10/100/1000Mbps RJ45',
          'منافذ الطاقة PoE+': '8 منافذ تدعم 802.3af/at PoE+ (حتى 30 وات للمنفذ)',
          'إجمالي ميزانية الطاقة': '150 وات (PoE Power Budget)',
          'سعة التبديل (Switching Capacity)': '32 Gbps',
          'ميزات الإدارة': '802.1Q VLAN, QoS, IGMP Snooping, Port Mirroring',
          'التصميم والتركيب': 'هيكل معدني قابل للتركيب في الراك (Rackmountable 1U)',
        },
      },
      {
        sku: 'UBI-U6-PRO',
        barcode: '810010076960',
        slug: 'ubiquiti-unifi-u6-pro-dual-band-wifi6-access-point',
        brand_slug: 'ubiquiti',
        name_ar: 'أكسس بوينت المؤسسات يوبيكويتي UniFi U6 Pro واي فاي 6 بسرعة 5.3 جيجابت',
        name_en: 'Ubiquiti UniFi U6 Pro Dual-Band WiFi 6 Enterprise Access Point',
        short_desc_ar: 'نقطة وصول لاسلكية احترافية للشركات والفنادق تدعم أكثر من 300 مستخدم متزامن وتقنية 4x4 MU-MIMO.',
        short_desc_en: 'High-performance dual-band WiFi 6 access point ideal for home and enterprise use, supporting 300+ clients.',
        description_ar:
          'صُمم جهاز Ubiquiti UniFi U6 Pro لتوفير تغطية واي فاي 6 فائقة الاستقرار للشركات والمقرات الإدارية والفيلات. يحقق معدل نقل بيانات إجمالي يصل إلى 5.3 جيجابت/ثانية بفضل قنوات 160MHz وتقنية 4x4 MU-MIMO وOFDMA على تردد 5GHz، ويعمل عبر منفذ Gigabit PoE مع إدارة سحابية كاملة عبر نظام UniFi Network.',
        description_en:
          'The UniFi U6 Pro is a dual-band WiFi 6 access point reaching 5.3 Gbps aggregate throughput rate and supporting over 300 concurrently connected clients.',
        cost_price: 7200,
        original_price: 9800,
        sale_price: 8950,
        discount_percent: 9,
        stock_quantity: 22,
        is_featured: true,
        categories: ['e', 'a'],
        tags: ['5'],
        images: [localUrlMap['unifi-u6-pro-ap.jpg']],
        specifications: {
          'الموديل': 'UniFi U6-Pro',
          'السرعة اللاسلكية': '5GHz (4x4 MU-MIMO 4.8 Gbps) + 2.4GHz (2x2 MIMO 573.5 Mbps)',
          'سعة المستخدمين المتزامنين': '+300 جهاز متصل في نفس الوقت',
          'منفذ الشبكة والطاقة': '1 × Gigabit RJ45 (يدعم التغذية عبر PoE 802.3at)',
          'معيار الحماية والعوامل الجوية': 'IP54 مقاوم للأتربة والرطوبة (تثبيت سقفي أو حائطي)',
          'إدارة الشبكة': 'UniFi Network Controller / عزل كامل لشبكة الضيوف',
        },
      },

      // --- Category: CCTV & Surveillance (f) & Security (b) ---
      {
        sku: 'HIK-DS2CD2087G2-LU',
        barcode: '6941264087214',
        slug: 'hikvision-ds-2cd2087g2-lu-8mp-4k-colorvu-ip-camera',
        brand_slug: 'hikvision',
        name_ar: 'كاميرا مراقبة شبكية هايكفيجن 8 ميجابكسل 4K ColorVu رؤية ليلية ملونة وميكروفون',
        name_en: 'Hikvision DS-2CD2087G2-LU 8MP 4K ColorVu AcuSense Bullet Network Camera',
        short_desc_ar: 'كاميرا مراقبة خارجية بدقة 4K حقيقية وتقنية ColorVu للتصوير الملون 24/7 مع ذكاء اصطناعي لتمييز البشر والمركبات.',
        short_desc_en: '8 MP ColorVu Fixed Bullet Network Camera with 24/7 colorful imaging, AcuSense AI, built-in mic, and IP67.',
        description_ar:
          'تقدم كاميرا Hikvision DS-2CD2087G2-LU دقة 8 ميجابكسل (4K Ultra HD) مع فتحة عدسة واسعة جداً F1.0 ومستشعر متطور يلتقط صوراً ملونة بالكامل على مدار 24 ساعة حتى في الظلام الدامس لمسافة 40 متراً. مزودة بميكروفون مدمج لتسجيل الصوت المحيطي، وتقنية AcuSense للذكاء الاصطناعي لفلترة الإنذارات الكاذبة وتصنيف الأشخاص والسيارات بدقة.',
        description_en:
          'Hikvision DS-2CD2087G2-LU 8MP 4K ColorVu camera delivers 24/7 full-color video, deep-learning human/vehicle classification, built-in microphone, and IP67 weatherproofing.',
        cost_price: 4600,
        original_price: 6400,
        sale_price: 5690,
        discount_percent: 11,
        stock_quantity: 35,
        is_featured: true,
        categories: ['f', 'b'],
        tags: ['3'],
        images: [localUrlMap['hikvision-4k-colorvu.jpg']],
        specifications: {
          'الموديل': 'DS-2CD2087G2-LU (ColorVu)',
          'دقة التصوير والمستشعر': '8 Megapixel (3840 × 2160) 4K / 1/1.2" Progressive Scan CMOS',
          'الرؤية الليلية الملونة': 'ColorVu 24/7 بفتحة عدسة F1.0 وإضاءة دافئة حتى 40 متر',
          'الذكاء الاصطناعي': 'AcuSense (تصنيف دقيق للبشر والمركبات وتقليل الإنذارات الكاذبة)',
          'الصوت والتخزين': 'ميكروفون مدمج عالي النقاء + منفذ MicroSD حتى 512 جيجابايت',
          'مقاومة العوامل الجوية': 'هيكل معدني بمعيار IP67 مقاوم للمياه والأتربة + تغذية PoE',
        },
      },
      {
        sku: 'TPL-TAPO-C520WS',
        barcode: '4895252503425',
        slug: 'tp-link-tapo-c520ws-outdoor-pan-tilt-2k-qhd-starlight-wifi-camera',
        brand_slug: 'tp-link',
        name_ar: 'كاميرا مراقبة خارجية متحركة 360 درجة تي بي-لينك تابو C520WS بدقة 2K QHD',
        name_en: 'TP-Link Tapo C520WS Outdoor Pan/Tilt 2K QHD Starlight Security Wi-Fi Camera',
        short_desc_ar: 'كاميرا واي فاي خارجية متحركة بزاوية 360° بدقة 2K QHD ورؤية ليلية ملونة Starlight وتتبع ذكي للحركة.',
        short_desc_en: '2K QHD Outdoor Pan/Tilt Security Wi-Fi Camera with Starlight Color Night Vision, Free AI Detection, and IP66.',
        description_ar:
          'احصل على تغطية شاملة بزاوية 360 درجة أفقياً و130 درجة رأسياً مع كاميرا المراقبة الخارجية TP-Link Tapo C520WS. تتميز بدقة 2K QHD ومستشعر Starlight لرؤية ليلية ملونة فائقة الوضوح، مع تتبع تلقائي ذكي للأشخاص والمركبات والحيوانات الأليفة، وإنذار صوتي وضوئي قابل للتخصيص وتحدث ثنائي الاتجاه.',
        description_en:
          'Tapo C520WS offers 2K QHD live view, Starlight color night vision, 360° visual coverage, smart AI person/pet/vehicle detection, and IP66 weatherproofing.',
        cost_price: 2450,
        original_price: 3600,
        sale_price: 3150,
        discount_percent: 13,
        stock_quantity: 42,
        is_featured: false,
        categories: ['f', 'b'],
        tags: ['3'],
        images: [localUrlMap['tapo-c520ws-ptz.jpg']],
        specifications: {
          'الموديل': 'Tapo C520WS',
          'دقة التصوير': '2K QHD (2560 × 1440 px) بمستشعر Starlight',
          'مجال الحركة': 'دوران أفقي 360° وإمالة رأسية 130° مع تتبع ذكي للحركة',
          'الاتصال بالشبكة': 'Wi-Fi 2.4GHz بهوائيين خارجيين + منفذ كابل شبكة Ethernet RJ45',
          'الصوت والإنذار': 'تحدث واستماع ثنائي الاتجاه (Two-Way Audio) + سارينة صوتية وضوئية',
          'التخزين والحماية': 'بطاقة MicroSD حتى 512GB أو Tapo Care + مقاومة أمطار IP66',
        },
      },

      // --- Category: Security & Access Systems (g) & Security (b) ---
      {
        sku: 'HIK-DS7616NXI-K2-16P',
        barcode: '6931847123892',
        slug: 'hikvision-ds-7616nxi-k2-16p-16ch-acusense-4k-poe-nvr',
        brand_slug: 'hikvision',
        name_ar: 'جهاز تسجيل كاميرات الشبكة الذكي هايكفيجن AcuSense NVR لـ 16 كاميرا بدقة 4K مع 16 منفذ PoE',
        name_en: 'Hikvision DS-7616NXI-K2/16P 16-Channel AcuSense 4K PoE NVR Recorder',
        short_desc_ar: 'جهاز تسجيل NVR احترافي لـ 16 كاميرا بـ 16 منفذ PoE مدمج وذكاء اصطناعي للتعرف على الوجوه ودعم هاردين حتى 20 تيرابايت.',
        short_desc_en: '16-ch 1U K Series AcuSense 4K PoE NVR with 16 Plug & Play PoE interfaces, Facial Recognition, and 2 SATA bays.',
        description_ar:
          'يمثل جهاز التسجيل الشبكي Hikvision DS-7616NXI-K2/16P قلب منظومة المراقبة الأمنية الحديثة، حيث يدعم تشغيل وتغذية 16 كاميرا IP مباشرة عبر 16 منفذ PoE مدمج (Plug & Play) بدقة عرض وتسجيل تصل إلى 12 ميجابكسل (4K HDMI). مزود بمعالج AcuSense الذكي للتعرف على الوجوه ومقارنتها والبحث السريع عن الأشخاص والسيارات.',
        description_en:
          'Hikvision DS-7616NXI-K2/16P supports up to 16 IP cameras with 16 independent PoE ports, H.265+ compression, 4K HDMI output, and AcuSense facial recognition.',
        cost_price: 9800,
        original_price: 13600,
        sale_price: 12190,
        discount_percent: 10,
        stock_quantity: 14,
        is_featured: true,
        categories: ['g', 'b'],
        tags: ['4'],
        images: [localUrlMap['hikvision-nvr-16ch.jpg']],
        specifications: {
          'الموديل': 'DS-7616NXI-K2/16P',
          'عدد القنوات ومنافذ PoE': '16 قناة IP + 16 منفذ PoE مستقل (ميزانية طاقة 200 وات)',
          'دقة العرض والتسجيل': 'يدعم كاميرات حتى 12MP ومخرج HDMI بدقة 4K (3840 × 2160)',
          'تقنية الضغط': 'H.265+ / H.265 / H.264+ لتوفير مساحة التخزين حتى 75%',
          'سعة الأقراص الصلبة': '2 مدخل SATA (يدعم حتى 10 تيرابايت لكل قرص - إجمالي 20TB)',
          'الذكاء الاصطناعي المدمج': 'التعرف على الوجوه (Facial Recognition) + حماية المحيط AcuSense',
        },
      },
      {
        sku: 'HIK-DS-K1T342MFWX',
        barcode: '6941264099316',
        slug: 'hikvision-ds-k1t342mfwx-face-recognition-access-control-terminal',
        brand_slug: 'hikvision',
        name_ar: 'جهاز الحضور والانصراف والتحكم في الأبواب ببصمة الوجه والإصبع هايكفيجن DS-K1T342MFWX',
        name_en: 'Hikvision DS-K1T342MFWX Face Recognition & Fingerprint Access Control Terminal',
        short_desc_ar: 'جهاز بصمة وجه وإصبع وكارت ذكي بشاشة لمس 4.3 بوصة وواي فاي مدمج يتعرف على الوجه في أقل من 0.2 ثانية.',
        short_desc_en: '4.3-inch touch screen Face Recognition Access Control Terminal with Fingerprint, Mifare Card, and Wi-Fi.',
        description_ar:
          'جهاز متكامل لإدارة الحضور والانصراف والتحكم في البوابات والأقفال الإلكترونية للشركات والمصانع من هايكفيجن. يضم شاشة لمس IPS مقاس 4.3 بوصة وعدستين بدقة 2 ميجابكسل مع خوارزمية التعرف العميق لمنع التلاعب بالصور أو الفيديوهات، ويتسع لـ 1500 وجه و3000 بصمة إصبع و3000 بطاقة ذكية مع اتصال Wi-Fi وTCP/IP.',
        description_en:
          'Hikvision DS-K1T342MFWX features a 4.3" LCD touch screen, 2MP wide-angle dual-lens camera, face anti-spoofing, 1,500 faces, 3,000 fingerprints, and two-way audio.',
        cost_price: 5100,
        original_price: 7200,
        sale_price: 6350,
        discount_percent: 12,
        stock_quantity: 19,
        is_featured: false,
        categories: ['g', 'b'],
        tags: ['3'],
        images: [localUrlMap['hikvision-face-terminal.jpg']],
        specifications: {
          'الموديل': 'DS-K1T342MFWX',
          'الشاشة والكاميرا': 'شاشة لمس 4.3 بوصة LCD + كاميرا مزدوجة العدسة 2MP WDR',
          'سعة التخزين': '1,500 بصمة وجه + 3,000 بصمة إصبع + 3,000 كارت Mifare + 150,000 حركة',
          'سرعة ودقة التعرف': 'أقل من 0.2 ثانية للشخص الواحد بدقة تتجاوز 99%',
          'طرق الاتصال': 'Wi-Fi لاسلكي + شبكة TCP/IP سلكية + منفذ USB + Wiegand / RS-485',
          'التحكم في الأبواب': 'يدعم توصيل القفل الكهربائي وحساس الباب وزر الخروج والإنتركم',
        },
      },

      // --- Category: Keyboards & Mice (d1) & Accessories (d) ---
      {
        sku: 'LOGI-MX-MASTER-3S',
        barcode: '5099206103726',
        slug: 'logitech-mx-master-3s-wireless-performance-mouse',
        brand_slug: 'logitech',
        name_ar: 'ماوس العمل الاحترافي اللاسلكي لوجيتك MX Master 3S بدقة 8000 DPI ونقر صامت',
        name_en: 'Logitech MX Master 3S Wireless Performance Mouse with Quiet Clicks',
        short_desc_ar: 'الماوس الاحترافي الأول للمبرمجين والمصممين بعجلة تمرير كهرومغناطيسية MagSpeed ومستشعر يعمل على الزجاج.',
        short_desc_en: 'Iconic wireless mouse remastered with Quiet Clicks, 8,000 DPI track-on-glass sensor, and MagSpeed scrolling.',
        description_ar:
          'تمت إعادة تصميم الأسطورة Logitech MX Master 3S ليمنحك دقة فائقة وحساسية تصل إلى 8000 DPI مع إمكانية العمل على أي سطح بما في ذلك الزجاج. يتميز بأزرار Quiet Clicks الأكثر هدوءاً بنسبة 90%، وعجلة التمرير الكهرومغناطيسية MagSpeed الفائقة السرعة (1000 سطر في الثانية)، وإمكانية الاقتران بـ 3 أجهزة في نفس الوقت عبر البلوتوث أو مستقبل Logi Bolt.',
        description_en:
          'Meet Logitech MX Master 3S — featuring 8,000 DPI optical tracking on glass, 90% quieter clicks, MagSpeed electromagnetic scrolling, and 70-day battery life.',
        cost_price: 3800,
        original_price: 5400,
        sale_price: 4799,
        discount_percent: 11,
        stock_quantity: 28,
        is_featured: true,
        categories: ['d1', 'd'],
        tags: [],
        images: [localUrlMap['logitech-mx-master-3s.jpg']],
        specifications: {
          'الموديل': 'MX Master 3S (Graphite)',
          'نوع المستشعر والدقة': 'Darkfield High Precision / من 200 إلى 8,000 DPI (يعمل على الزجاج)',
          'عدد الأزرار والعجلات': '7 أزرار قابلة للتخصيص + عجلة MagSpeed + عجلة إبهام جانبية',
          'الاتصال اللاسلكي': 'Bluetooth Low Energy + مستقبل Logi Bolt USB (يدعم 3 أجهزة معاً)',
          'البطارية والشحن': 'بطارية Li-Po 500mAh تدوم حتى 70 يوماً + شحن سريع عبر USB-C',
          'التوافق': 'Windows, macOS, Linux, ChromeOS, iPadOS',
        },
      },
      {
        sku: 'ASUS-ROG-AZOTH-75',
        barcode: '4711081987413',
        slug: 'asus-rog-azoth-75-wireless-custom-mechanical-gaming-keyboard',
        brand_slug: 'asus',
        name_ar: 'لوحة مفاتيح ألعاب ميكانيكية لاسلكية أسوس ROG Azoth 75% بشاشة OLED ومفاتيح قابلة للتبديل',
        name_en: 'ASUS ROG Azoth 75% Wireless Custom Gaming Mechanical Keyboard with OLED Display',
        short_desc_ar: 'كيبورد ميكانيكي احترافي بتصميم Gasket Mount ثلاثي الطبقات لعزل الصوت وشاشة OLED تفاعلية ومفاتيح ROG NX.',
        short_desc_en: '75% gaming custom keyboard with silicone gasket mount, three-layer dampening foam, OLED display, and tri-mode wireless.',
        description_ar:
          'تجمع لوحة المفاتيح الميكانيكية ASUS ROG Azoth بين مميزات الكيبوردات الاحترافية المعدلة (Custom Keyboards) وأداء الألعاب التنافسي. تأتي بتصميم Gasket Mount من السيليكون مع 3 طبقات من الفوم العازل للصوت، ومفاتيح ROG NX المشحمة مسبقاً والقابلة للتبديل السريع (Hot-Swappable)، بالإضافة إلى شاشة OLED ذكية مقاس 2 بوصة واتصال ثلاثي الأوضاع.',
        description_en:
          'ROG Azoth is a 75% wireless gaming keyboard featuring a 2-inch OLED panel, three-way control knob, hot-swappable pre-lubed ROG NX mechanical switches, and tri-mode connectivity.',
        cost_price: 8200,
        original_price: 11500,
        sale_price: 9990,
        discount_percent: 13,
        stock_quantity: 12,
        is_featured: true,
        categories: ['d1', 'd'],
        tags: [],
        images: [localUrlMap['asus-rog-azoth-kb.jpg']],
        specifications: {
          'الموديل': 'ROG Azoth (75% Form Factor)',
          'نوع المفاتيح': 'مفاتيح ميكانيكية ROG NX مشحمة مسبقاً وقابلة للتبديل (Hot-Swappable)',
          'الشاشة المدمجة': 'شاشة OLED مقاس 2 بوصة لعرض حالة النظام والبطارية والملتميديا',
          'أنماط الاتصال': 'لاسلكي 2.4GHz SpeedNova + بلوتوث (3 أجهزة) + سلكي USB-C',
          'الهيكل والعزل الصوتي': 'غطاء علوي معدني + Silicone Gasket Mount + 3 طبقات فوم PORON',
          'عمر البطارية': 'تصل إلى 2000+ ساعة (مع إيقاف الشاشة وإضاءة RGB)',
        },
      },

      // --- Category: Headsets & Audio (d2) & Accessories (d) ---
      {
        sku: 'HX-CLOUD-III-WL',
        barcode: '197029651842',
        slug: 'hyperx-cloud-iii-wireless-gaming-headset-dts-spatial-audio',
        brand_slug: 'hyperx',
        name_ar: 'سماعة الألعاب اللاسلكية هايبر إكس Cloud III ببطارية 120 ساعة وصوت محيطي DTS',
        name_en: 'HyperX Cloud III Wireless Gaming Headset with 120-Hour Battery & DTS Spatial Audio',
        short_desc_ar: 'سماعة ألعاب لاسلكية فائقة الراحة ببطارية خارقة تدوم 120 ساعة ومشغلات صوتية 53 ملم مائلة وميكروفون نقي 10 ملم.',
        short_desc_en: 'Up to 120-hour battery life, angled 53mm drivers, DTS Headphone:X Spatial Audio, and signature HyperX comfort.',
        description_ar:
          'تمثل سماعة HyperX Cloud III Wireless الجيل الجديد من سلسلة Cloud الشهيرة، حيث توفر ما يصل إلى 120 ساعة من اللعب المتواصل بشحنة واحدة عبر اتصال 2.4GHz فائق السرعة. تتميز بمشغلات صوتية 53 ملم مائلة ومضبوطة بدقة مع تفعيل مدى الحياة لتقنية الصوت المحيطي ثلاثي الأبعاد DTS Headphone:X، ووسائد أذن من الفوم الذكي المغلف بالجلد الفاخر.',
        description_en:
          'HyperX Cloud III Wireless delivers up to 120 hours of battery life, angled 53mm drivers with lifetime DTS Headphone:X Spatial Audio, and an ultra-clear 10mm microphone.',
        cost_price: 5200,
        original_price: 7400,
        sale_price: 6490,
        discount_percent: 12,
        stock_quantity: 25,
        is_featured: true,
        categories: ['d2', 'd'],
        tags: [],
        images: [localUrlMap['hyperx-cloud-iii.jpg']],
        specifications: {
          'الموديل': 'HyperX Cloud III Wireless (Black/Red)',
          'المشغلات الصوتية': 'Dynamic 53mm Angled Drivers مع مغناطيس نيوديميوم',
          'الصوت المحيطي': 'DTS Headphone:X Spatial Audio ثلاثي الأبعاد',
          'عمر البطارية': 'تصل إلى 120 ساعة من الاستخدام المتواصل بشحنة واحدة',
          'الميكروفون': 'ميكروفون 10mm قابل للفصل مع فلتر ضوضاء مدمج ومؤشر LED لكتم الصوت',
          'التوافق والاتصال': '2.4GHz Wireless عبر محول USB-C / USB-A (PC, PS5, PS4, Switch)',
        },
      },
      {
        sku: 'SONY-WH-1000XM5',
        barcode: '4548736132580',
        slug: 'sony-wh-1000xm5-wireless-noise-canceling-headphones',
        brand_slug: 'sony',
        name_ar: 'سماعة الرأس اللاسلكية سوني WH-1000XM5 بعزل الضوضاء الذكي و8 ميكروفونات',
        name_en: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
        short_desc_ar: 'أقوى نظام عزل ضوضاء في العالم بمعالجين من سوني و8 ميكروفونات وصوت Hi-Res LDAC وبطارية 30 ساعة.',
        short_desc_en: 'Industry-leading noise cancellation with 2 processors controlling 8 microphones, 30-hour battery, and crystal-clear calls.',
        description_ar:
          'ترتقي سماعة Sony WH-1000XM5 بتجربة الاستماع وعزل الضوضاء إلى مستوى غير مسبوق بفضل معالجين مخصصين (QN1 + V1) يتحكمان في 8 ميكروفونات لعزل الضوضاء المحيطة تلقائياً. تدعم تقنية الصوت عالي الدقة LDAC وميزة التحدث لإيقاف الموسيقى تلقائياً Speak-to-Chat، والاتصال بجهازين معاً Multipoint مع شحن فائق السرعة (3 دقائق شحن تمنحك 3 ساعات تشغيل).',
        description_en:
          'Sony WH-1000XM5 features Auto NC Optimizer, 8 microphones powered by Integrated Processor V1 and HD Noise Canceling Processor QN1, 30-hour battery life, and Multipoint connection.',
        cost_price: 12900,
        original_price: 17800,
        sale_price: 15990,
        discount_percent: 10,
        stock_quantity: 16,
        is_featured: true,
        categories: ['d2', 'd'],
        tags: ['7'],
        images: [localUrlMap['sony-wh1000xm5.jpg']],
        specifications: {
          'الموديل': 'Sony WH-1000XM5',
          'تقنية عزل الضوضاء': 'معالج HD QN1 + معالج V1 مع 8 ميكروفونات و Auto NC Optimizer',
          'وحدة التشغيل الصوتية': '30mm مصممة خصيصاً من ألياف الكربون المركبة (Hi-Res Audio)',
          'الاتصال والترميز': 'Bluetooth 5.2 (SBC, AAC, LDAC) + اتصال مزدوج Multipoint',
          'البطارية والشحن السريع': 'حتى 30 ساعة (مع ANC) / 40 ساعة (بدون ANC) + شحن USB-PD سريع',
          'الوزن والمرفقات': '250 جرام فقط + حافظة حمل قابلة للطي وكابل صوت وكابل USB-C',
        },
      },

      // --- Category: Smart Vacuums & Cleaners (h1) & Electronics (h) ---
      {
        sku: 'ROBO-S8-PRO-ULTRA',
        barcode: '6970995786811',
        slug: 'roborock-s8-pro-ultra-robot-vacuum-and-sonic-mop-auto-dock',
        brand_slug: 'roborock',
        name_ar: 'مكنسة وممسحة روبوت ذكية روبوروك S8 Pro Ultra بمحطة تفريغ وغسيل وتجفيف ذاتي',
        name_en: 'Roborock S8 Pro Ultra Robot Vacuum and Sonic Mop with RockDock Ultra',
        short_desc_ar: 'مكنسة روبوت متكاملة بقوة شفط 6000Pa وفرشاة مزدوجة DuoRoller ومحطة ذكية تقوم بالتفريغ والغسيل والتجفيف تلقائياً.',
        short_desc_en: 'All-in-one RockDock Ultra system with 6000Pa HyperForce suction, DuoRoller Riser brush, and VibraRise 2.0 mopping.',
        description_ar:
          'انسَ عناء التنظيف اليدوي تماماً مع الروبوت الذكي Roborock S8 Pro Ultra المزود بمحطة RockDock Ultra الشاملة التي تقوم بتفريغ الغبار وغسيل الممسحة وتجفيفها بالهواء الدافئ وإعادة ملء خزان المياه ذاتياً. يتميز بقوة شفط هائلة 6000 باسكال، وفرشاة DuoRoller المزدوجة القابلة للرفع، ونظام المسح الاهتزازي VibraRise 2.0 مع ملاحة ليزر LiDAR وتفادي العوائق ثلاثي الأبعاد.',
        description_en:
          'Roborock S8 Pro Ultra combines 6,000Pa suction, DuoRoller Riser Brush, VibraRise 2.0 Sonic Mopping, Reactive 3D Obstacle Avoidance, and a fully automated RockDock Ultra station.',
        cost_price: 36000,
        original_price: 48500,
        sale_price: 43900,
        discount_percent: 9,
        stock_quantity: 8,
        is_featured: true,
        categories: ['h1', 'h'],
        tags: ['7'],
        images: [localUrlMap['roborock-s8-pro-ultra.jpg']],
        specifications: {
          'الموديل': 'Roborock S8 Pro Ultra',
          'قوة الشفط ونظام الفرشاة': '6,000 Pa HyperForce + فرشاة مطاطية مزدوجة DuoRoller Riser',
          'نظام المسح الذكي': 'VibraRise 2.0 اهتزاز صوتي (3000 مرة/دقيقة) مع رفع تلقائي على السجاد',
          'وظائف محطة RockDock Ultra': 'تفريغ ذاتي للأتربة + غسيل ذاتي للممسحة + تجفيف بالهواء الدافئ + تعبئة المياه',
          'الملاحة وتفادي العوائق': 'PreciSense LiDAR Navigation + Reactive 3D Obstacle Avoidance',
          'البطارية ووقت التشغيل': '5200 mAh (تصل إلى 180 دقيقة تشغيل متواصل)',
        },
      },
      {
        sku: 'DYSON-V15-DETECT',
        barcode: '5025155073148',
        slug: 'dyson-v15-detect-absolute-cordless-vacuum-cleaner-laser',
        brand_slug: 'dyson',
        name_ar: 'مكنسة دايسون اللاسلكية الذكية V15 Detect Absolute بكاشف الغبار الليزري وشاشة LCD',
        name_en: 'Dyson V15 Detect Absolute Cordless Vacuum Cleaner with Laser Dust Detection',
        short_desc_ar: 'أقوى مكنسة لاسلكية ذكية من دايسون بقوة 240AW وشعاع ليزر يكشف الغبار غير المرئي ومستشعر Piezo الصوتي.',
        short_desc_en: 'Dyson most powerful, intelligent cordless vacuum with Laser Slim Fluffy cleaner head, Piezo sensor, and LCD screen.',
        description_ar:
          'تأتي مكنسة Dyson V15 Detect Absolute بمحرك Dyson Hyperdymium الرقمي الذي يدور بسرعة 125,000 دورة في الدقيقة لتوليد قوة شفط لا مثيل لها، مع رأس التنظيف المزود بإضاءة ليزر دقيقة تكشف ذرات الغبار الخفية على الأرضيات الصلبة. يقوم مستشعر Piezo بقياس وعدّ جزيئات الغبار 15,000 مرة في الثانية وضبط قوة الشفط تلقائياً مع عرض إثبات التنظيف الحي على شاشة LCD الملونة.',
        description_en:
          'Dyson V15 Detect Absolute reveals microscopic dust with illumination, automatically adapts suction power via its acoustic Piezo sensor, and displays scientific proof of a deep clean on its LCD screen.',
        cost_price: 24500,
        original_price: 33500,
        sale_price: 29990,
        discount_percent: 10,
        stock_quantity: 11,
        is_featured: true,
        categories: ['h1', 'h'],
        tags: ['7'],
        images: [localUrlMap['dyson-v15-detect.jpg']],
        specifications: {
          'الموديل': 'Dyson V15 Detect Absolute',
          'قوة الشفط والمحرك': '240 Air Watts (AW) / محرك Hyperdymium بسرعة 125,000 لفة/دقيقة',
          'التقنيات الذكية': 'إضاءة كشف الغبار المجهري + حساس Piezo الصوتي + شاشة LCD حية',
          'نظام الفلترة': 'فلترة HEPA محكمة بالكامل تحجز 99.99% من الجزيئات الدقيقة حتى 0.1 ميكرون',
          'سعة الحاوية والبطارية': 'سعة 0.77 لتر + وقت تشغيل يصل إلى 60 دقيقة بشحنة واحدة',
          'الوزن والملحقات': '3.1 كجم + فرشاة Digital Motorbar المانعة لتشابك الشعر + رأس Fluffy الليزري',
        },
      },

      // --- Category: Home Care Appliances (h2) & Electronics (h) ---
      {
        sku: 'XIAOMI-PURIFIER-4PRO',
        barcode: '6934177756177',
        slug: 'xiaomi-smart-air-purifier-4-pro-oled-laser-sensor',
        brand_slug: 'xiaomi',
        name_ar: 'منقي الهواء الذكي شاومي Smart Air Purifier 4 Pro بشاشة OLED ومستشعر ليزر مزدوج',
        name_en: 'Xiaomi Smart Air Purifier 4 Pro with OLED Touch Display & Dual Laser Sensor',
        short_desc_ar: 'ينقي هواء الغرفة بالكامل في 15 دقيقة بمعدل 500 م³/ساعة ويزيل 99.97% من الغبار وحبوب اللقاح والروائح.',
        short_desc_en: '500m³/h Particle CADR covering up to 60m², OLED touch display, negative air ionization, and Mi Home app control.',
        description_ar:
          'يوفر منقي الهواء Xiaomi Smart Air Purifier 4 Pro هواءً نقياً وصحياً بمعدل تدفق يصل إلى 8330 لتراً من الهواء النقي في الدقيقة (500 م³/ساعة CADR) لتغطية مساحات تصل إلى 60 متراً مربعاً. مزود بفلتر ثلاثي الطبقات مع الكربون النشط يزيل 99.97% من الجسيمات الدقيقة حتى 0.3 ميكرون، ومولد أيونات سالبة لإنعاش الهواء، وشاشة لمس OLED تعرض مؤشرات PM2.5 وPM10 ودرجة الحرارة والرطوبة لحظياً.',
        description_en:
          'Xiaomi Smart Air Purifier 4 Pro features a 500 m³/h CADR, 35–60m² coverage area, PM2.5/PM10 dual-effect laser sensor, OLED touch screen, and ultra-quiet 33.7dB sleep mode.',
        cost_price: 7800,
        original_price: 10900,
        sale_price: 9450,
        discount_percent: 13,
        stock_quantity: 20,
        is_featured: false,
        categories: ['h2', 'h'],
        tags: ['7'],
        images: [localUrlMap['xiaomi-air-purifier-4pro.jpg']],
        specifications: {
          'الموديل': 'Xiaomi Smart Air Purifier 4 Pro',
          'معدل تنقية الهواء (CADR)': '500 م³/ساعة (8,330 لتر هواء نقي في الدقيقة)',
          'مساحة التغطية الفعالة': 'من 35 إلى 60 متر مربع',
          'كفاءة الفلترة': 'يزيل 99.97% من الجسيمات بحجم 0.3 ميكرون + كربون نشط + أيونات سالبة',
          'الشاشة والمستشعرات': 'شاشة لمس OLED + مستشعر ليزر مزدوج لقياس PM2.5 و PM10 والحرارة والرطوبة',
          'التحكم الذكي ومستوى الضجيج': 'تطبيق Mi Home + أوامر صوتية Alexa/Google + وضع نوم هادئ 33.7 dB',
        },
      },
      {
        sku: 'PHILIPS-HD9270-90',
        barcode: '8710103951872',
        slug: 'philips-essential-airfryer-xl-6-2l-digital-hd9270-90',
        brand_slug: 'philips',
        name_ar: 'قلاية هوائية ديجيتال فيليبس إسينشال بحجم عائلي XL سعة 6.2 لتر - 2000 وات',
        name_en: 'Philips Essential Airfryer XL 6.2L 1.2Kg Digital Touch Screen 2000W (HD9270/90)',
        short_desc_ar: 'قلاية بدون زيت بحجم عائلي XL (6.2 لتر / 1.2 كجم) بتقنية Rapid Air لطهي صحي بدهون أقل بنسبة 90% وشاشة لمس بـ 7 برامج.',
        short_desc_en: 'Philips Airfryer XL 6.2L with Rapid Air technology for 90% less fat, digital touch screen with 7 presets, and 2000W power.',
        description_ar:
          'استمتع بأشهى الأطعمة المقرمشة من الخارج والطرية من الداخل مع دهون أقل بنسبة 90% بفضل قلاية فيليبس الهوائية Philips Essential Airfryer XL (HD9270/90). تأتي بوعاء عائلي كبير سعة 6.2 لتر وسلة تتسع لـ 1.2 كجم (تكفي 5 حصص عائلية)، وتعمل بقدرة 2000 وات مع تقنية Rapid Air وتصميم نجم البحر لتوزيع الهواء الساخن، وشاشة لمس رقمية تضم 7 برامج طهي مسبقة الإعداد وميزة الاحتفاظ بالسخونة.',
        description_en:
          'Philips Essential Airfryer XL HD9270/90 features a 6.2L pan (1.2Kg basket), 2000W heating power, Rapid Air technology, and a 7-preset digital touch screen.',
        cost_price: 5400,
        original_price: 7600,
        sale_price: 6690,
        discount_percent: 12,
        stock_quantity: 27,
        is_featured: true,
        categories: ['h2', 'h'],
        tags: ['7'],
        images: [localUrlMap['philips-airfryer-xl.jpg']],
        specifications: {
          'الموديل': 'Philips Essential XL HD9270/90',
          'القدرة الكهربائية': '2000 وات لتسخين فوري وطهي سريع',
          'السعة والحجم': 'حلة سعة 6.2 لتر / سلة طعام سعة 1.2 كجم (حجم عائلي 5 أفراد)',
          'تقنية الطهي': 'Rapid Air Technology (طهي صحي بدهون أقل حتى 90%)',
          'لوحة التحكم والبرامج': 'شاشة لمس رقمية مع 7 برامج مسبقة + وظيفة حفظ الطعام دافئاً Keep Warm',
          'النظافة والأمان': 'جميع الأجزاء القابلة للفك مطلية بطبقة غير لاصقة وآمنة لغسالة الأطباق',
        },
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const pData of newProducts) {
      let product = await Product.findOne({ where: { sku: pData.sku } });
      const brandId = brandMap[pData.brand_slug] || null;

      if (!product) {
        const newId = await generateProductId({ Product });
        product = await Product.create({
          id: newId,
          brand_id: brandId,
          name_ar: pData.name_ar,
          name_en: pData.name_en,
          slug: pData.slug,
          sku: pData.sku,
          barcode: pData.barcode,
          short_desc_ar: pData.short_desc_ar,
          short_desc_en: pData.short_desc_en,
          description_ar: pData.description_ar,
          description_en: pData.description_en,
          specifications: pData.specifications,
          cost_price: pData.cost_price,
          original_price: pData.original_price,
          sale_price: pData.sale_price,
          discount_percent: pData.discount_percent,
          stock_quantity: pData.stock_quantity,
          reserved_stock: 0,
          low_stock_threshold: 5,
          is_featured: pData.is_featured,
          rating_avg: 4.9,
          reviews_count: Math.floor(Math.random() * 25) + 8,
          is_active: true,
        });
        createdCount++;
      } else {
        await product.update({
          brand_id: brandId,
          name_ar: pData.name_ar,
          name_en: pData.name_en,
          short_desc_ar: pData.short_desc_ar,
          short_desc_en: pData.short_desc_en,
          description_ar: pData.description_ar,
          description_en: pData.description_en,
          specifications: pData.specifications,
          cost_price: pData.cost_price,
          original_price: pData.original_price,
          sale_price: pData.sale_price,
          discount_percent: pData.discount_percent,
          stock_quantity: pData.stock_quantity,
          is_featured: pData.is_featured,
          is_active: true,
        });
        updatedCount++;
      }

      // Sync Categories
      await ProductCategory.destroy({ where: { product_id: product.id } });
      for (let i = 0; i < pData.categories.length; i++) {
        await ProductCategory.create({
          product_id: product.id,
          category_id: pData.categories[i],
          is_primary: i === 0,
        });
      }

      // Sync Tags
      await ProductTag.destroy({ where: { product_id: product.id } });
      for (const tagId of pData.tags) {
        await ProductTag.create({
          product_id: product.id,
          tag_id: tagId,
        });
      }

      // Sync Product Images
      await ProductImage.destroy({ where: { product_id: product.id } });
      for (let i = 0; i < pData.images.length; i++) {
        await ProductImage.create({
          product_id: product.id,
          image_url: pData.images[i],
          alt_text_ar: pData.name_ar,
          alt_text_en: pData.name_en,
          is_primary: i === 0,
          sort_order: i,
        });
      }
    }

    const totalProductsNow = await Product.count();
    console.log(
      `Done! Created: ${createdCount}, Updated: ${updatedCount}, Total Products in DB: ${totalProductsNow}`
    );
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
})();
