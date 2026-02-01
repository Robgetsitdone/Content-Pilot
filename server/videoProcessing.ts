import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const TEMP_DIR = "/tmp/video-processing";

async function ensureTempDir() {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (e) {
  }
}

export interface VideoFrameResult {
  frameBase64: string;
  duration: number;
  width: number;
  height: number;
}

export async function extractVideoFrame(videoBase64: string): Promise<VideoFrameResult> {
  await ensureTempDir();
  
  const id = randomUUID();
  const videoPath = join(TEMP_DIR, `${id}.mp4`);
  const framePath = join(TEMP_DIR, `${id}_frame.jpg`);
  
  try {
    let cleanBase64 = videoBase64;
    if (videoBase64.startsWith('data:')) {
      cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, '');
    }
    
    const videoBuffer = Buffer.from(cleanBase64, 'base64');
    await writeFile(videoPath, videoBuffer);
    
    const { stdout: probeOutput } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    );
    
    const probeData = JSON.parse(probeOutput);
    const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
    const duration = parseFloat(probeData.format?.duration || '0');
    const width = videoStream?.width || 1920;
    const height = videoStream?.height || 1080;
    
    const frameTime = Math.min(1, duration / 3);
    
    await execAsync(
      `ffmpeg -y -ss ${frameTime} -i "${videoPath}" -vframes 1 -q:v 2 -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" "${framePath}"`
    );
    
    const frameBuffer = await readFile(framePath);
    const frameBase64 = `data:image/jpeg;base64,${frameBuffer.toString('base64')}`;
    
    return {
      frameBase64,
      duration,
      width,
      height
    };
  } finally {
    try {
      await unlink(videoPath);
    } catch (e) {}
    try {
      await unlink(framePath);
    } catch (e) {}
  }
}

export function isVideoMimeType(base64OrMime: string): boolean {
  if (base64OrMime.startsWith('data:video/')) {
    return true;
  }
  const videoMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  return videoMimes.some(mime => base64OrMime.includes(mime));
}
