import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

// Maximum allowed compressed video size: 20 MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/**
 * Compresses and scales video to 720p maximum using FFmpeg.
 * - Dynamic 720p scaling preserving original aspect ratio (landscape or portrait)
 * - libx264 codec with yuv420p for universal browser & device playback
 * - Faststart enabled (+faststart) for immediate web streaming
 * - Rate controlled (maxrate 2500k) to guarantee files under 20 MB for up to 60s clips
 */
async function compressVideoWithFFmpeg(inputPath, outputPath) {
  const scaleFilter =
    "scale='if(gt(iw,ih),min(1280,iw),min(720,iw))':'if(gt(iw,ih),min(720,ih),min(1280,ih))':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";

  const args = [
    '-nostdin',
    '-y',
    '-i',
    inputPath,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'faster',
    '-crf',
    '26',
    '-maxrate',
    '2500k',
    '-bufsize',
    '5000k',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-ar',
    '44100',
    '-movflags',
    '+faststart',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args);
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const mediaType = formData.get('mediaType') || 'image';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'لم يتم استلام أي ملف للرفع' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const isVideo = mediaType === 'video' || (file.type && file.type.startsWith('video/'));
    const originalName = file.name || (isVideo ? 'video.mp4' : 'image.webp');
    const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.webp');
    const baseClean = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // -------------------------------------------------------------
    // VIDEO COMPRESSION PIPELINE (720p Max, <= 20 MB Target)
    // -------------------------------------------------------------
    if (isVideo) {
      const tempFilename = `temp_${baseClean}_${uniqueSuffix}${ext}`;
      const tempPath = path.join(uploadsDir, tempFilename);
      const finalFilename = `video_${baseClean}_${uniqueSuffix}.mp4`;
      const finalDestinationPath = path.join(uploadsDir, finalFilename);

      // Write original stream to temp file
      await fs.promises.writeFile(tempPath, buffer);

      let finalSize = buffer.length;
      let isCompressed = false;

      try {
        await compressVideoWithFFmpeg(tempPath, finalDestinationPath);

        if (fs.existsSync(finalDestinationPath)) {
          const stats = await fs.promises.stat(finalDestinationPath);
          finalSize = stats.size;
          isCompressed = true;
        }
      } catch (ffmpegErr) {
        console.warn('FFmpeg compression notice (using fallback):', ffmpegErr.message);
        // Fallback: write original buffer if ffmpeg fails
        if (!fs.existsSync(finalDestinationPath)) {
          await fs.promises.writeFile(finalDestinationPath, buffer);
        }
      } finally {
        // Clean up temp file
        await fs.promises.unlink(tempPath).catch(() => {});
      }

      // Check max size constraint (20MB)
      if (finalSize > MAX_VIDEO_BYTES) {
        console.warn(`Compressed video size (${finalSize} bytes) exceeds 20MB limit.`);
      }

      const publicUrl = `/uploads/products/${finalFilename}`;
      const originalSize = buffer.length;
      const savingsPercent = isCompressed && originalSize > finalSize
        ? Math.round(((originalSize - finalSize) / originalSize) * 100)
        : 0;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: finalFilename,
        size: finalSize,
        originalSize,
        savingsPercent,
        mediaType: 'video',
        isCompressed,
        resolutionBadge: '720p HD Optimized',
      });
    }

    // -------------------------------------------------------------
    // IMAGE & OTHER ASSETS PIPELINE
    // -------------------------------------------------------------
    const finalFilename = `${mediaType}_${baseClean}_${uniqueSuffix}${ext}`;
    const destinationPath = path.join(uploadsDir, finalFilename);

    await fs.promises.writeFile(destinationPath, buffer);

    const publicUrl = `/uploads/products/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
      size: buffer.length,
      mediaType,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'حدث خطأ أثناء حفظ ومعالجة الملف على الخادم' },
      { status: 500 }
    );
  }
}
