import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES =
  /jpeg|jpg|png|gif|webp|svg|glb|gltf|obj|fbx|pdf|mp4|webm/;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PDFS_DIR = path.join(process.cwd(), 'pdfs');

/** Ensure upload directories exist */
async function ensureDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(PDFS_DIR, { recursive: true });
}

interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

/** Process a File from FormData and save to disk */
export async function saveUploadedFile(
  file: File,
  fieldName = 'file'
): Promise<UploadedFile> {
  await ensureDirs();

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_TYPES.test(ext.replace('.', ''))) {
    throw new Error(
      'Invalid file type. Supported: images, 3D models (GLB/GLTF), videos'
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 50MB.');
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `${fieldName}-${uniqueSuffix}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filename,
    originalName: file.name,
    path: filePath,
    size: file.size,
  };
}

export { UPLOADS_DIR, PDFS_DIR };
