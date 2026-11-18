'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  FaFileZipper,
  FaFileCsv,
  FaUpload,
  FaDownload,
  FaImage,
  FaFileArrowDown,
  FaCircleCheck,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaXmark,
  FaCheck,
  FaSpinner,
  FaBoxesStacked,
  FaLayerGroup,
  FaArrowRight,
  FaMagnifyingGlass,
  FaEye,
} from 'react-icons/fa6';
import './ProductZipManager.scss';

// Robust CSV Parser (Handles quotes, internal commas, multi-line values, and UTF-8 BOM)
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  const lines = [];
  let row = [''];
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
    i++;
  }
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    lines.push(row);
  }
  return lines;
}

// Convert data to escaped CSV row
function toCSVRow(arr) {
  return arr
    .map((val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(',');
}

export default function ProductZipManager({
  isOpen,
  onClose,
  exportOpen,
  onCloseExport,
  onSuccess,
  categories = [],
  selectedProductIds = [],
  products = [],
  totalCount = 0,
  lang = 'ar',
  showToast = () => {},
}) {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef(null);

  // ---------------------------------------------------------------------------
  // IMPORT STATE
  // ---------------------------------------------------------------------------
  const [isDragging, setIsDragging] = useState(false);
  const [parsingZip, setParsingZip] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [zipFileName, setZipFileName] = useState('');
  const [zipFileSize, setZipFileSize] = useState('');
  const [parsedProducts, setParsedProducts] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // all | ready | issues
  const [searchPreview, setSearchPreview] = useState('');
  const [savingProgress, setSavingProgress] = useState(null); // { current, total, percentage }
  const [zoomImage, setZoomImage] = useState(null);

  // ---------------------------------------------------------------------------
  // EXPORT STATE
  // ---------------------------------------------------------------------------
  const [exportScope, setExportScope] = useState('all'); // all | selected | category
  const [exportCategoryId, setExportCategoryId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null); // { message, percentage }

  // Clean object URLs on unmount or reset
  useEffect(() => {
    return () => {
      if (parsedProducts) {
        parsedProducts.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
      }
    };
  }, [parsedProducts]);

  // Auth helper
  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('trendline_admin_token');
    if (token && token !== 'undefined' && token !== 'null') return token;
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token=') || row.startsWith('trendline_token='));
    if (cookieToken) return decodeURIComponent(cookieToken.split('=')[1]);
    return '';
  };

  // ---------------------------------------------------------------------------
  // 1. GENERATE SAMPLE ZIP TEMPLATE (Immediate download for testing)
  // ---------------------------------------------------------------------------
  const handleDownloadSampleTemplate = async () => {
    try {
      showToast(isRtl ? 'جاري تجهيز وتحميل القالب التجريبي...' : 'Generating sample ZIP...');
      const sampleZip = new JSZip();

      // Sample CSV Header & Rows
      const csvHeaders = [
        'name_ar',
        'name_en',
        'category',
        'brand',
        'original_price',
        'sale_price',
        'cost_price',
        'stock_quantity',
        'sku',
        'barcode',
        'image',
        'short_desc_ar',
        'description_ar',
      ];

      const sampleRows = [
        [
          'كارت شاشة RTX 4070 Ti Super 16GB Gaming OC',
          'GeForce RTX 4070 Ti Super 16GB Gaming OC',
          categories[0]?.name_ar || 'كروت شاشة',
          'Gigabyte',
          '42500',
          '39900',
          '36000',
          '12',
          'GPU-4070TI-OC',
          '6221234567890',
          'images/sample_gpu.png',
          'أقوى كارت شاشة للألعاب بدقة 2K و 4K ومونتاج الفيديو',
          'كارت شاشة احترافي مزود بذاكرة 16GB GDDR6X ونظام تبريد ثلاثي فائق الهدوء',
        ],
        [
          'شاشة ألعاب قيمنق 27 بوصة 180Hz 1ms Fast IPS',
          'Gaming Monitor 27 inch 180Hz 1ms Fast IPS',
          categories[1]?.name_ar || 'شاشات',
          'Samsung',
          '8900',
          '7990',
          '7100',
          '20',
          'MON-27-180HZ',
          '6221234567891',
          'images/sample_monitor.png',
          'شاشة احترافية فائقة السرعة للألعاب التنافسية',
          'لوحة Fast IPS بدقة QHD ومعدل تحديث 180Hz مع دعم HDR10 و FreeSync Premium',
        ],
      ];

      const csvString = '\uFEFF' + [toCSVRow(csvHeaders), ...sampleRows.map(toCSVRow)].join('\r\n');
      sampleZip.file('products.csv', csvString);

      // Create SVG placeholder images and add to images/ folder
      const imgFolder = sampleZip.folder('images');

      const createSvgBadge = (title, subtitle, color) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
          <rect width="600" height="600" fill="#0f172a" rx="30"/>
          <circle cx="300" cy="240" r="140" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="4"/>
          <path d="M250 200 L350 200 L300 290 Z" fill="${color}"/>
          <text x="300" y="420" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
          <text x="300" y="460" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">${subtitle}</text>
          <text x="300" y="520" font-family="Arial, sans-serif" font-size="16" fill="#38bdf8" text-anchor="middle">Trendline Systems Sample Image</text>
        </svg>
      `;

      imgFolder.file('sample_gpu.png', createSvgBadge('RTX 4070 Ti Super', '16GB GDDR6X Gaming OC', '#38bdf8'));
      imgFolder.file('sample_monitor.png', createSvgBadge('Gaming Monitor 27"', '180Hz Fast IPS QHD', '#10b981'));

      // Generate & Download ZIP
      const blob = await sampleZip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trendline_products_sample_template.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(isRtl ? 'تم تحميل القالب التجريبي بنجاح!' : 'Sample template downloaded!');
    } catch (err) {
      console.error('Sample ZIP error:', err);
      showToast(isRtl ? 'حدث خطأ أثناء إنشاء القالب' : 'Failed to generate sample');
    }
  };

  // ---------------------------------------------------------------------------
  // 2. PROCESS IMPORTED ZIP FILE
  // ---------------------------------------------------------------------------
  const handleZipFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showToast(isRtl ? 'يرجى اختيار ملف بصيغة .zip فقط' : 'Please upload a .zip file');
      return;
    }

    setParsingZip(true);
    setParsingStep(isRtl ? 'قراءة أرشيف الـ ZIP وفك الضغط...' : 'Reading ZIP archive...');
    setZipFileName(file.name);
    setZipFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    try {
      const zip = await JSZip.loadAsync(file);

      // Step A: Find the CSV file
      setParsingStep(isRtl ? 'البحث عن ملف CSV داخل الأرشيف...' : 'Locating CSV file...');
      const csvEntry = Object.values(zip.files).find(
        (f) => !f.dir && f.name.toLowerCase().endsWith('.csv')
      );

      if (!csvEntry) {
        showToast(isRtl ? 'خطأ: لم يتم العثور على أي ملف .csv داخل ملف الـ ZIP' : 'Error: No .csv file found in ZIP');
        setParsingZip(false);
        return;
      }

      // Step B: Index all image files inside the ZIP
      setParsingStep(isRtl ? 'فهرسة مجلد الصور والملفات المرفقة...' : 'Indexing images...');
      const imageFiles = {};
      const allFiles = Object.values(zip.files);
      for (const entry of allFiles) {
        if (!entry.dir && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(entry.name)) {
          // Normalize paths: both full path (images/pic.jpg) and base name (pic.jpg)
          const baseName = entry.name.split('/').pop().toLowerCase();
          imageFiles[entry.name.toLowerCase()] = entry;
          imageFiles[baseName] = entry;
        }
      }

      // Step C: Parse CSV
      setParsingStep(isRtl ? 'تحليل بيانات المنتجات ومطابقة الصور...' : 'Parsing products & matching images...');
      const csvText = await csvEntry.async('string');
      const rows = parseCSV(csvText);

      if (rows.length < 2) {
        showToast(isRtl ? 'ملف الـ CSV فارغ أو لا يحتوي على صفوف بيانات' : 'CSV file is empty');
        setParsingZip(false);
        return;
      }

      // Map Headers
      const rawHeaders = rows[0].map((h) => h.trim().toLowerCase());
      const getColIndex = (...keys) => {
        for (const k of keys) {
          const idx = rawHeaders.indexOf(k.toLowerCase());
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const nameArIdx = getColIndex('name_ar', 'الاسم بالعربية', 'اسم المنتج', 'name', 'title');
      const nameEnIdx = getColIndex('name_en', 'الاسم بالإنجليزية', 'product name en', 'english_name');
      const catIdx = getColIndex('category', 'القسم', 'الفئة', 'category_name', 'category_id');
      const brandIdx = getColIndex('brand', 'البراند', 'العلامة التجارية', 'brand_name');
      const origPriceIdx = getColIndex('original_price', 'السعر', 'السعر الأصلي', 'price');
      const salePriceIdx = getColIndex('sale_price', 'سعر الخصم', 'الخصم', 'discount_price');
      const costPriceIdx = getColIndex('cost_price', 'سعر التكلفة', 'التكلفة');
      const stockIdx = getColIndex('stock_quantity', 'المخزون', 'الكمية', 'stock', 'qty');
      const skuIdx = getColIndex('sku', 'الكود', 'كود المنتج');
      const barcodeIdx = getColIndex('barcode', 'الباركود', 'ean');
      const imageIdx = getColIndex('image', 'الصورة', 'image_url', 'images', 'image_name', 'صورة');
      const shortDescIdx = getColIndex('short_desc_ar', 'الوصف المختصر', 'short_description');
      const descIdx = getColIndex('description_ar', 'الوصف', 'الوصف الكامل', 'description');

      const items = [];

      // Loop through data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

        const name_ar = nameArIdx !== -1 ? row[nameArIdx]?.trim() : '';
        const name_en = nameEnIdx !== -1 ? row[nameEnIdx]?.trim() : '';
        const category_name = catIdx !== -1 ? row[catIdx]?.trim() : '';
        const brand_name = brandIdx !== -1 ? row[brandIdx]?.trim() : '';
        const original_price = origPriceIdx !== -1 ? row[origPriceIdx]?.trim() : '';
        const sale_price = salePriceIdx !== -1 ? row[salePriceIdx]?.trim() : '';
        const cost_price = costPriceIdx !== -1 ? row[costPriceIdx]?.trim() : '0';
        const stock_quantity = stockIdx !== -1 ? row[stockIdx]?.trim() : '0';
        const sku = skuIdx !== -1 ? row[skuIdx]?.trim() : '';
        const barcode = barcodeIdx !== -1 ? row[barcodeIdx]?.trim() : '';
        const image_ref = imageIdx !== -1 ? row[imageIdx]?.trim() : '';
        const short_desc_ar = shortDescIdx !== -1 ? row[shortDescIdx]?.trim() : '';
        const description_ar = descIdx !== -1 ? row[descIdx]?.trim() : '';

        // Validation
        const numPrice = parseFloat(original_price);
        const hasValidPrice = !isNaN(numPrice) && numPrice > 0;
        const hasName = Boolean(name_ar);

        // Find Image in zip
        let imageFound = false;
        let previewUrl = null;
        let dataBase64 = null;
        let filename = '';

        if (image_ref) {
          const cleanRef = image_ref.replace(/\\/g, '/').toLowerCase();
          const baseClean = cleanRef.split('/').pop();
          const matchedEntry = imageFiles[cleanRef] || imageFiles[baseClean] || imageFiles[`images/${baseClean}`];

          if (matchedEntry) {
            imageFound = true;
            filename = matchedEntry.name.split('/').pop();
            const blob = await matchedEntry.async('blob');
            dataBase64 = await matchedEntry.async('base64');
            previewUrl = URL.createObjectURL(blob);
          }
        }

        const isValid = hasName && hasValidPrice;

        items.push({
          rowId: i,
          selected: isValid, // Select valid items by default
          name_ar: name_ar || (isRtl ? 'بدون اسم' : 'Unnamed'),
          name_en: name_en || name_ar,
          category_name: category_name || (isRtl ? 'عام' : 'General'),
          brand_name: brand_name || '',
          original_price: hasValidPrice ? numPrice : 0,
          sale_price: sale_price && !isNaN(parseFloat(sale_price)) ? parseFloat(sale_price) : null,
          cost_price: parseFloat(cost_price) || 0,
          stock_quantity: parseInt(stock_quantity, 10) || 0,
          sku,
          barcode,
          short_desc_ar,
          description_ar,
          image_ref,
          imageFound,
          previewUrl,
          dataBase64,
          filename,
          isValid,
          errors: [
            !hasName ? (isRtl ? 'اسم المنتج مفقود' : 'Name is missing') : null,
            !hasValidPrice ? (isRtl ? 'السعر غير صالح' : 'Invalid price') : null,
          ].filter(Boolean),
        });
      }

      setParsedProducts(items);
      setParsingZip(false);
      showToast(isRtl ? `تم استخراج ${items.length} منتج من الأرشيف` : `Parsed ${items.length} products`);
    } catch (err) {
      console.error('ZIP parsing error:', err);
      showToast(isRtl ? 'فشل فك ضغط وقراءة ملف الـ ZIP' : 'Failed to parse ZIP');
      setParsingZip(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleZipFile(files[0]);
    }
  };

  // Toggle Selection
  const toggleSelectAll = (checked) => {
    if (!parsedProducts) return;
    setParsedProducts((prev) =>
      prev.map((p) => (p.isValid ? { ...p, selected: checked } : p))
    );
  };

  const toggleSelectRow = (rowId) => {
    setParsedProducts((prev) =>
      prev.map((p) => (p.rowId === rowId ? { ...p, selected: !p.selected } : p))
    );
  };

  // ---------------------------------------------------------------------------
  // 3. CONFIRM & COMMIT BULK IMPORT
  // ---------------------------------------------------------------------------
  const handleCommitImport = async () => {
    const selected = parsedProducts.filter((p) => p.selected && p.isValid);
    if (selected.length === 0) {
      showToast(isRtl ? 'يرجى تحديد منتج واحد صالح على الأقل للاستيراد' : 'Select at least one valid product');
      return;
    }

    setSavingProgress({ current: 0, total: selected.length, percentage: 0 });

    try {
      const token = getAuthToken();
      const payloadProducts = selected.map((p) => ({
        name_ar: p.name_ar,
        name_en: p.name_en,
        category_name: p.category_name,
        brand_name: p.brand_name,
        original_price: p.original_price,
        sale_price: p.sale_price,
        cost_price: p.cost_price,
        stock_quantity: p.stock_quantity,
        sku: p.sku,
        barcode: p.barcode,
        short_desc_ar: p.short_desc_ar,
        description_ar: p.description_ar,
        images: p.dataBase64
          ? [
              {
                filename: p.filename || 'imported_image.png',
                dataBase64: p.dataBase64,
              },
            ]
          : [],
      }));

      const res = await fetch('/api/v1/catalog/products/bulk-import-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: payloadProducts }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || (isRtl ? 'تم استيراد المنتجات بنجاح!' : 'Import completed!'));
        if (onSuccess) onSuccess();
        handleCloseImportModal();
      } else {
        showToast(json.message || (isRtl ? 'فشل استيراد المنتجات' : 'Import failed'));
      }
    } catch (err) {
      console.error('Import commit error:', err);
      showToast(isRtl ? 'تعذر الاتصال بالخادم لإتمام الاستيراد' : 'Server connection error');
    } finally {
      setSavingProgress(null);
    }
  };

  const handleCloseImportModal = () => {
    setParsedProducts(null);
    setZipFileName('');
    setZipFileSize('');
    setSavingProgress(null);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // 4. BULK EXPORT ZIP (All, Selected, or Specific Category)
  // ---------------------------------------------------------------------------
  const handleExportZip = async () => {
    setExporting(true);
    setExportProgress({ message: isRtl ? 'جاري جلب بيانات المنتجات من قاعدة البيانات...' : 'Fetching product data...', percentage: 10 });

    try {
      const token = getAuthToken();
      let queryParams = `scope=${exportScope}`;
      if (exportScope === 'selected') {
        if (!selectedProductIds.length) {
          showToast(isRtl ? 'لم يتم تحديد أي منتجات من الجدول لتصديرها' : 'No products selected');
          setExporting(false);
          return;
        }
        queryParams += `&ids=${selectedProductIds.join(',')}`;
      } else if (exportScope === 'category') {
        if (!exportCategoryId || exportCategoryId === 'all') {
          showToast(isRtl ? 'يرجى اختيار فئة محددة للتصدير' : 'Please select a category');
          setExporting(false);
          return;
        }
        queryParams += `&category_id=${exportCategoryId}`;
      }

      const res = await fetch(`/api/v1/catalog/products/export-all?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data || json.data.length === 0) {
        showToast(isRtl ? 'لا توجد منتجات مطابقة لخيارات التصدير المحددة' : 'No matching products found');
        setExporting(false);
        return;
      }

      const exportList = json.data;
      setExportProgress({ message: isRtl ? `تم جلب ${exportList.length} منتج. جاري تجميع الأرشيف والصور...` : `Fetched ${exportList.length} products. Packaging images...`, percentage: 30 });

      const zip = new JSZip();
      const imgFolder = zip.folder('images');

      const csvHeaders = [
        'id',
        'name_ar',
        'name_en',
        'category',
        'brand',
        'original_price',
        'sale_price',
        'cost_price',
        'stock_quantity',
        'sku',
        'barcode',
        'image',
        'short_desc_ar',
        'description_ar',
        'is_active',
        'is_featured',
      ];

      const csvRows = [];

      for (let i = 0; i < exportList.length; i++) {
        const prod = exportList[i];
        const pct = Math.round(30 + ((i + 1) / exportList.length) * 50);
        setExportProgress({
          message: isRtl ? `جاري تنزيل وضغط الصور (${i + 1}/${exportList.length})...` : `Packaging images (${i + 1}/${exportList.length})...`,
          percentage: pct,
        });

        let imagePathInZip = '';
        const primaryImg = prod.images?.find((img) => img.is_primary) || prod.images?.[0];

        if (primaryImg && primaryImg.image_url) {
          try {
            const imgRes = await fetch(primaryImg.image_url);
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const ext = primaryImg.image_url.split('.').pop().split('?')[0] || 'png';
              const cleanSku = (prod.sku || prod.id).replace(/[^a-zA-Z0-9_-]/g, '_');
              const imgFilename = `${cleanSku}_img.${ext}`;
              imgFolder.file(imgFilename, blob);
              imagePathInZip = `images/${imgFilename}`;
            }
          } catch (imgErr) {
            console.warn(`Could not bundle image for product ${prod.id}:`, imgErr);
          }
        }

        const categoryName = prod.categories?.[0]?.name_ar || '';
        const brandName = prod.brand?.name_ar || '';

        csvRows.push([
          prod.id,
          prod.name_ar,
          prod.name_en || '',
          categoryName,
          brandName,
          prod.original_price,
          prod.sale_price || '',
          prod.cost_price || '0',
          prod.stock_quantity,
          prod.sku,
          prod.barcode || '',
          imagePathInZip,
          prod.short_desc_ar || '',
          prod.description_ar || '',
          prod.is_active ? '1' : '0',
          prod.is_featured ? '1' : '0',
        ]);
      }

      // Add CSV to zip
      const csvContent = '\uFEFF' + [toCSVRow(csvHeaders), ...csvRows.map(toCSVRow)].join('\r\n');
      zip.file('products.csv', csvContent);

      // Generate ZIP
      setExportProgress({ message: isRtl ? 'جاري ضغط الملف النهائي وحفظ الأرشيف...' : 'Generating final ZIP file...', percentage: 90 });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

      // Trigger Browser Download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trendline_products_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(isRtl ? `تم تصدير ${exportList.length} منتج مع الصور بنجاح!` : `Exported ${exportList.length} products successfully!`);
      onCloseExport();
    } catch (err) {
      console.error('Export error:', err);
      showToast(isRtl ? 'فشل تصدير ملف الـ ZIP' : 'Failed to export ZIP');
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  // Filtered preview rows
  const filteredPreview = useMemo(() => {
    if (!parsedProducts) return [];
    return parsedProducts.filter((p) => {
      if (filterTab === 'ready' && (!p.isValid || !p.imageFound)) return false;
      if (filterTab === 'issues' && p.isValid && p.imageFound) return false;
      if (searchPreview.trim()) {
        const q = searchPreview.trim().toLowerCase();
        return (
          p.name_ar.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parsedProducts, filterTab, searchPreview]);

  // Statistics
  const stats = useMemo(() => {
    if (!parsedProducts) return { total: 0, valid: 0, imagesFound: 0, missingImages: 0, selectedCount: 0 };
    const total = parsedProducts.length;
    const valid = parsedProducts.filter((p) => p.isValid).length;
    const imagesFound = parsedProducts.filter((p) => p.imageFound).length;
    const missingImages = total - imagesFound;
    const selectedCount = parsedProducts.filter((p) => p.selected && p.isValid).length;
    return { total, valid, imagesFound, missingImages, selectedCount };
  }, [parsedProducts]);

  return (
    <>
      {/* =========================================================================
          1. IMPORT ZIP MODAL (DRAG & DROP + PREVIEW & APPROVE)
          ========================================================================= */}
      {isOpen && (
        <div className="zip-modal-backdrop" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="zip-modal-window">
            {/* Modal Header */}
            <div className="zip-modal-header">
              <div className="modal-title-cluster">
                <div className="modal-icon-bubble">
                  <FaFileZipper size={22} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {isRtl ? 'استيراد وإضافة المنتجات عبر أرشيف ZIP' : 'Bulk Import Products via ZIP Archive'}
                  </h3>
                  <p className="modal-subtitle">
                    {isRtl
                      ? 'ارفع ملف ZIP يحتوي على ملف .csv ومجلد images/ للصور لمطابقتها وإضافتها تلقائياً'
                      : 'Upload a ZIP containing a .csv file and an images/ folder to batch-import products'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseImportModal}
                disabled={Boolean(savingProgress)}
              >
                <FaXmark size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="zip-modal-body">
              {/* STAGE A: Dropzone (When no parsed products yet) */}
              {!parsedProducts && (
                <div className="dropzone-stage">
                  <div
                    className={`zip-drop-area ${isDragging ? 'dragging' : ''} ${parsingZip ? 'parsing' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !parsingZip && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleZipFile(e.target.files[0]);
                      }}
                    />

                    {parsingZip ? (
                      <div className="parsing-feedback">
                        <FaSpinner className="spinner-icon" size={42} />
                        <h4>{isRtl ? 'جاري فك ضغط وتحليل ملف الـ ZIP...' : 'Parsing ZIP Archive...'}</h4>
                        <p className="parsing-step-text">{parsingStep}</p>
                      </div>
                    ) : (
                      <div className="drop-content-idle">
                        <div className="drop-icon-pod">
                          <FaUpload size={32} />
                        </div>
                        <h4 className="drop-main-text">
                          {isRtl ? 'اسحب وأفلت ملف الـ ZIP هنا' : 'Drag & Drop your ZIP file here'}
                        </h4>
                        <p className="drop-subtext">
                          {isRtl
                            ? 'أو اضغط لتصفح الملفات من جهازك (ملفات .zip فقط)'
                            : 'Or click to browse from your computer (.zip only)'}
                        </p>
                        <span className="file-specs-badge">
                          <FaFileCsv size={13} />
                          <span>{isRtl ? 'يتطلب وجود products.csv ومجلد images/' : 'Requires products.csv + images/ folder'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sample Template Bar */}
                  <div className="sample-template-bar">
                    <div className="sample-info-side">
                      <FaFileArrowDown size={18} className="template-icon" />
                      <div>
                        <strong>{isRtl ? 'هل ترغب في تجربة نموذج جاهز؟' : 'Need a ready-made sample?'}</strong>
                        <p>
                          {isRtl
                            ? 'حمّل قالباً تجريبياً يحتوي على ملف CSV مطابق ومجلد صور لاختبار العملية فوراً.'
                            : 'Download a sample ZIP containing a verified CSV and image folder.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-download-sample"
                      onClick={handleDownloadSampleTemplate}
                    >
                      <FaDownload size={13} />
                      <span>{isRtl ? 'تحميل قالب ZIP تجريبي' : 'Download Sample ZIP'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE B: Review & Approve Table (When products parsed) */}
              {parsedProducts && (
                <div className="preview-stage">
                  {/* File & Metric Bar */}
                  <div className="preview-summary-bar">
                    <div className="file-meta-tag">
                      <FaFileZipper size={14} />
                      <span className="file-name">{zipFileName}</span>
                      <span className="file-size">({zipFileSize})</span>
                    </div>

                    <div className="stats-badges-cluster">
                      <span className="stat-pill total">
                        {isRtl ? 'الإجمالي:' : 'Total:'} <strong>{stats.total}</strong>
                      </span>
                      <span className="stat-pill matched">
                        <FaCircleCheck size={11} />
                        {isRtl ? 'الصور المتطابقة:' : 'Images matched:'} <strong>{stats.imagesFound}</strong>
                      </span>
                      {stats.missingImages > 0 && (
                        <span className="stat-pill missing">
                          <FaTriangleExclamation size={11} />
                          {isRtl ? 'صور مفقودة:' : 'Missing images:'} <strong>{stats.missingImages}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Filters & Search Row */}
                  <div className="preview-filters-row">
                    <div className="filter-tabs">
                      <button
                        type="button"
                        className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterTab('all')}
                      >
                        {isRtl ? 'كل المنتجات' : 'All Products'} ({stats.total})
                      </button>
                      <button
                        type="button"
                        className={`tab-btn ${filterTab === 'ready' ? 'active' : ''}`}
                        onClick={() => setFilterTab('ready')}
                      >
                        {isRtl ? 'جاهزة للاستيراد' : 'Ready'} ({stats.valid})
                      </button>
                      {stats.missingImages > 0 && (
                        <button
                          type="button"
                          className={`tab-btn ${filterTab === 'issues' ? 'active' : ''}`}
                          onClick={() => setFilterTab('issues')}
                        >
                          {isRtl ? 'صور مفقودة' : 'Missing Images'} ({stats.missingImages})
                        </button>
                      )}
                    </div>

                    <div className="preview-search-box">
                      <FaMagnifyingGlass size={13} />
                      <input
                        type="text"
                        placeholder={isRtl ? 'ابحث في محتوى الملف...' : 'Search parsed items...'}
                        value={searchPreview}
                        onChange={(e) => setSearchPreview(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="preview-table-container">
                    <table className="preview-data-table">
                      <thead>
                        <tr>
                          <th className="th-check">
                            <input
                              type="checkbox"
                              checked={stats.selectedCount === stats.valid && stats.valid > 0}
                              onChange={(e) => toggleSelectAll(e.target.checked)}
                            />
                          </th>
                          <th>{isRtl ? 'الصورة' : 'Image'}</th>
                          <th>{isRtl ? 'اسم المنتج' : 'Product Name'}</th>
                          <th>{isRtl ? 'القسم / الفئة' : 'Category'}</th>
                          <th>{isRtl ? 'كود SKU' : 'SKU'}</th>
                          <th>{isRtl ? 'السعر' : 'Price'}</th>
                          <th>{isRtl ? 'المخزون' : 'Stock'}</th>
                          <th>{isRtl ? 'حالة الصورة' : 'Image Match'}</th>
                          <th>{isRtl ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPreview.map((item) => (
                          <tr
                            key={item.rowId}
                            className={`${!item.isValid ? 'row-invalid' : ''} ${item.selected ? 'row-selected' : ''}`}
                          >
                            <td className="td-check">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                disabled={!item.isValid}
                                onChange={() => toggleSelectRow(item.rowId)}
                              />
                            </td>

                            <td className="td-image">
                              {item.previewUrl ? (
                                <div
                                  className="thumb-zoom-wrap"
                                  onClick={() => setZoomImage(item.previewUrl)}
                                  title={isRtl ? 'انقر لتكبير الصورة' : 'Click to enlarge'}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={item.previewUrl} alt={item.name_ar} className="table-thumb-img" />
                                </div>
                              ) : (
                                <div className="no-image-pod" title={isRtl ? 'لم يتم العثور على الصورة في مجلد images' : 'No image'}>
                                  <FaImage size={14} />
                                </div>
                              )}
                            </td>

                            <td className="td-name">
                              <div className="name-cluster">
                                <span className="name-ar-text">{item.name_ar}</span>
                                {item.name_en && <span className="name-en-text">{item.name_en}</span>}
                              </div>
                            </td>

                            <td>
                              <span className="category-pill-tag">{item.category_name}</span>
                            </td>

                            <td className="td-sku">
                              <code>{item.sku || (isRtl ? '(تلقائي)' : 'Auto')}</code>
                            </td>

                            <td className="td-price">
                              <span className="price-val">
                                {item.original_price?.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                              </span>
                              {item.sale_price && (
                                <span className="sale-val">
                                  {item.sale_price?.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                                </span>
                              )}
                            </td>

                            <td>
                              <span className={`stock-badge ${item.stock_quantity > 0 ? 'in' : 'zero'}`}>
                                {item.stock_quantity}
                              </span>
                            </td>

                            <td>
                              {item.imageFound ? (
                                <span className="image-status-pill found">
                                  <FaCircleCheck size={11} />
                                  <span>{item.filename}</span>
                                </span>
                              ) : (
                                <span className="image-status-pill missing">
                                  <FaTriangleExclamation size={11} />
                                  <span>{item.image_ref || (isRtl ? 'مفقودة' : 'Missing')}</span>
                                </span>
                              )}
                            </td>

                            <td>
                              {item.isValid ? (
                                <span className="status-badge valid">
                                  <FaCheck size={11} />
                                  <span>{isRtl ? 'جاهز' : 'Valid'}</span>
                                </span>
                              ) : (
                                <span className="status-badge invalid" title={item.errors.join(' | ')}>
                                  <FaCircleExclamation size={11} />
                                  <span>{isRtl ? 'بيانات ناقصة' : 'Invalid'}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Saving Progress Bar Overlay */}
                  {savingProgress && (
                    <div className="saving-progress-banner">
                      <FaSpinner className="spinner-icon" size={18} />
                      <div className="progress-details">
                        <span>{isRtl ? 'جاري رفع الصور وحفظ المنتجات في قاعدة البيانات...' : 'Importing products & images...'}</span>
                      </div>
                    </div>
                  )}

                  {/* Sticky Action Footer */}
                  <div className="preview-action-footer">
                    <div className="footer-stats-note">
                      <span>{isRtl ? 'تم تحديد' : 'Selected'}: </span>
                      <strong>{stats.selectedCount}</strong> {isRtl ? 'منتج من أصل' : 'of'}{' '}
                      <strong>{stats.valid}</strong> {isRtl ? 'منتج صالح' : 'valid items'}
                    </div>

                    <div className="footer-btns-group">
                      <button
                        type="button"
                        className="btn-action-cancel"
                        onClick={handleCloseImportModal}
                        disabled={Boolean(savingProgress)}
                      >
                        {isRtl ? 'إلغاء العملية' : 'Cancel'}
                      </button>

                      <button
                        type="button"
                        className="btn-action-reupload"
                        onClick={() => setParsedProducts(null)}
                        disabled={Boolean(savingProgress)}
                      >
                        {isRtl ? 'اختيار ملف ZIP آخر' : 'Upload Another ZIP'}
                      </button>

                      <button
                        type="button"
                        className="btn-action-commit"
                        onClick={handleCommitImport}
                        disabled={stats.selectedCount === 0 || Boolean(savingProgress)}
                      >
                        <FaUpload size={13} />
                        <span>
                          {isRtl
                            ? `حفظ واعتماد (${stats.selectedCount}) منتج`
                            : `Import (${stats.selectedCount}) Products`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. EXPORT ZIP MODAL (ALL, SELECTED, OR SPECIFIC CATEGORY)
          ========================================================================= */}
      {exportOpen && (
        <div className="zip-modal-backdrop" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="zip-modal-window export-window">
            <div className="zip-modal-header">
              <div className="modal-title-cluster">
                <div className="modal-icon-bubble export-bubble">
                  <FaDownload size={22} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {isRtl ? 'تصدير وتحميل المنتجات (أرشيف ZIP)' : 'Export Products & Images to ZIP'}
                  </h3>
                  <p className="modal-subtitle">
                    {isRtl
                      ? 'تحميل ملف products.csv مع مجلد كامل للصور الأصلية بدقة عالية'
                      : 'Download products.csv with a full images/ folder packaged in a single ZIP'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={onCloseExport}
                disabled={exporting}
              >
                <FaXmark size={18} />
              </button>
            </div>

            <div className="zip-modal-body export-body">
              {/* Scope Options */}
              <div className="export-options-list">
                <label className={`export-radio-card ${exportScope === 'all' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="exportScope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                  />
                  <div className="radio-content">
                    <span className="radio-title">{isRtl ? 'كل المنتجات بالمتجر' : 'All Store Products'}</span>
                    <span className="radio-desc">
                      {isRtl
                        ? `تصدير كافة المنتجات الموجودة في قاعدة البيانات (${totalCount || products.length} منتج) مع جميع صورها.`
                        : `Export entire catalog (${totalCount || products.length} items) with high-res photos.`}
                    </span>
                  </div>
                </label>

                <label
                  className={`export-radio-card ${exportScope === 'selected' ? 'active' : ''} ${selectedProductIds.length === 0 ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="selected"
                    disabled={selectedProductIds.length === 0}
                    checked={exportScope === 'selected'}
                    onChange={() => setExportScope('selected')}
                  />
                  <div className="radio-content">
                    <span className="radio-title">
                      {isRtl ? 'المنتجات المحددة حالياً' : 'Selected Products'} ({selectedProductIds.length})
                    </span>
                    <span className="radio-desc">
                      {selectedProductIds.length > 0
                        ? isRtl
                          ? `تصدير الـ (${selectedProductIds.length}) منتج المحددة بواسطة مربعات الاختيار في الجدول.`
                          : `Export only the ${selectedProductIds.length} checked items.`
                        : isRtl
                        ? 'يرجى تحديد بعض المنتجات من الجدول أولاً لاستخدام هذا الخيار.'
                        : 'Check products in the table to enable this.'}
                    </span>
                  </div>
                </label>

                <label className={`export-radio-card ${exportScope === 'category' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="exportScope"
                    value="category"
                    checked={exportScope === 'category'}
                    onChange={() => setExportScope('category')}
                  />
                  <div className="radio-content">
                    <span className="radio-title">{isRtl ? 'منتجات قسم وفئة محددة' : 'Products of Specific Category'}</span>
                    <span className="radio-desc">
                      {isRtl ? 'اختر قسماً معيناً لتصدير كافة المنتجات التابعة له فقط.' : 'Export items belonging to a single category.'}
                    </span>

                    {exportScope === 'category' && (
                      <div className="category-select-wrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={exportCategoryId}
                          onChange={(e) => setExportCategoryId(e.target.value)}
                        >
                          <option value="">{isRtl ? '-- اختر القسم المطلوب --' : '-- Choose Category --'}</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_ar} ({c.name_en || ''})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Progress Feedback */}
              {exporting && exportProgress && (
                <div className="export-progress-panel">
                  <div className="progress-top-info">
                    <FaSpinner className="spinner-icon" size={16} />
                    <span>{exportProgress.message}</span>
                    <span className="pct">{exportProgress.percentage}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${exportProgress.percentage}%` }} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="export-modal-footer">
                <button
                  type="button"
                  className="btn-action-cancel"
                  onClick={onCloseExport}
                  disabled={exporting}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn-action-commit export-commit"
                  onClick={handleExportZip}
                  disabled={exporting}
                >
                  <FaDownload size={13} />
                  <span>{exporting ? (isRtl ? 'جاري التحضير...' : 'Processing...') : isRtl ? 'بدء التصدير وتحميل ZIP' : 'Download ZIP Archive'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. IMAGE LIGHTBOX ZOOM PREVIEW
          ========================================================================= */}
      {zoomImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomImage} alt="Enlarged preview" className="enlarged-img" />
            <button type="button" className="btn-close-zoom" onClick={() => setZoomImage(null)}>
              <FaXmark size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
