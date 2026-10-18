/**
 * formatFactory
 * -------------------------------------------------------------
 * 
 * @param {File|Blob} file - الملف المختار من جهاز المستخدم
 * @param {Object} options - خيارات إضافية لمعالجة الوسائط
 * @returns {Promise<Object>} نتيجة المعالجة متضمنة الملف الجاهز ورابط المعاينة والبيانات التقنية
 */
export async function formatFactory(file, options = {}) {
  if (!file) {
    throw new Error('لم يتم تمرير أي ملف للمحرك formatFactory');
  }

  const isVideo = file.type?.startsWith('video/') ||
    /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name || '');

  if (isVideo) {
    return await processVideo(file, options);
  } else {
    return await processImage(file, options);
  }
}

/**
 * معالجة الصور وتحويلها لصيغة WebP بجودة 80%
 */
async function processImage(file, options = {}) {
  const quality = options.quality ?? 0.8; // جودة 80%
  const maxDimension = options.maxDimension ?? 1920;

  return new Promise((resolve, reject) => {
    // التحقق من صلاحية الملف
    if (!file.type.startsWith('image/')) {
      return reject(new Error('الملف المحدد ليس ملف صورة صالح'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const originalWidth = width;
        const originalHeight = height;

        // مواءمة الأبعاد مع الحفاظ التام على نسبة العرض إلى الارتفاع (Aspect Ratio)
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return reject(new Error('فشل إنشاء سياق رسم الكانفاس ثنائي الأبعاد'));
        }

        // تحسين دقة إعادة التشكيل
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // التحويل إلى صيغة WebP بنسبة جودة 80% (0.8)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              return reject(new Error('تعذر تحويل الصورة إلى صيغة WebP'));
            }

            const cleanBaseName = (file.name || 'image')
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFileName = `${cleanBaseName}.webp`;

            const webpFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const formattedSize = blob.size;
            const savingsPercent =
              originalSize > formattedSize
                ? Math.round(((originalSize - formattedSize) / originalSize) * 100)
                : 0;

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              success: true,
              mediaType: 'image',
              file: webpFile,
              blob,
              previewUrl,
              originalName: file.name,
              formattedName: newFileName,
              originalSize,
              formattedSize,
              originalWidth,
              originalHeight,
              width,
              height,
              savingsPercent,
              format: 'image/webp',
              quality: Math.round(quality * 100),
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('تعذر قراءة الصورة وتحليل بياناتها'));
    };

    img.src = objectUrl;
  });
}

/**
 * معالجة الفيديوهات وفحص المدة (أقصى دقيقة) وضبط الدقة (720p كحد أقصى)
 */
async function processVideo(file, options = {}) {
  const maxDurationSec = options.maxDurationSec ?? 60; // دقيقة واحدة كحد أقصى

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;

    // مهلة في حال تعطل قراءة الفيديو
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('استغرقت قراءة بيانات الفيديو وقتاً طويلاً. تأكد من سلامة صيغة الملف.'));
    }, 15000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);

      const duration = video.duration || 0;
      const naturalWidth = video.videoWidth || 0;
      const naturalHeight = video.videoHeight || 0;

      // 1. الفحص الصارم للمدة: بحد أقصى دقيقة واحدة (60 ثانية)
      if (duration > maxDurationSec + 0.5) {
        URL.revokeObjectURL(objectUrl);
        return reject(
          new Error(
            `مدة الفيديو (${formatDuration(duration)}) تتجاوز الحد الأقصى المسموح به للمنصة (دقيقة واحدة / 60 ثانية). يرجى تقصير مدة المقطع.`
          )
        );
      }

      // 2. منطق ضبط الدقة (720p):
      // إذا كانت الجودة أعلى من 720p يتم التحديد إلى 720p،
      // وإذا كانت الجودة 720p أو أقل تبقى كما هي دون تغيير كما هو مطلوب نصاً.
      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;
      let isScaledDown = false;

      const isLandscape = naturalWidth >= naturalHeight;
      const primaryDimension = isLandscape ? naturalHeight : naturalWidth;

      if (primaryDimension > 720) {
        isScaledDown = true;
        if (isLandscape) {
          targetHeight = 720;
          targetWidth = Math.round((naturalWidth * 720) / naturalHeight);
        } else {
          targetWidth = 720;
          targetHeight = Math.round((naturalHeight * 720) / naturalWidth);
        }
      }

      // حساب بطاقة الدقة
      let resolutionBadge = '720p HD';
      if (!isScaledDown) {
        const minDim = Math.min(naturalWidth, naturalHeight);
        resolutionBadge = minDim >= 720 ? '720p HD' : `${minDim}p`;
      }

      // 3. التقاط لقطة غلاف للمقطع (Poster Frame) بصيغة WebP بجودة 80%
      const seekTime = Math.min(1.0, Math.max(0.1, duration / 2));
      video.currentTime = seekTime;

      video.onseeked = () => {
        let posterUrl = '';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth || 640;
          canvas.height = targetHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            posterUrl = canvas.toDataURL('image/webp', 0.8);
          }
        } catch (e) {
          console.warn('Poster frame generation error:', e);
        }

        resolve({
          success: true,
          mediaType: 'video',
          file,
          previewUrl: objectUrl,
          posterUrl,
          originalName: file.name,
          originalSize: file.size,
          formattedSize: file.size,
          duration,
          durationFormatted: formatDuration(duration),
          originalWidth: naturalWidth,
          originalHeight: naturalHeight,
          width: targetWidth,
          height: targetHeight,
          isScaledDown,
          resolutionBadge,
          format: file.type || 'video/mp4',
        });
      };
    };

    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error('تعذر تشغيل أو قراءة ترميز ملف الفيديو'));
    };

    video.src = objectUrl;
  });
}

/**
 * تنسيق الثواني إلى صيغة دقيقة:ثانية (e.g. 00:45)
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * تنسيق حجم الملفات لوحدات سهلة القراءة
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default formatFactory;
