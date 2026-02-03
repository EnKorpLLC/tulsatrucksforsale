import { readFile, unlink } from 'fs/promises';
import formidable from 'formidable';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BUCKET = 'truck-photos';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 6 * 1024 * 1024; // 6MB

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: MAX_SIZE,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'You must be logged in to upload photos' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'Upload not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local',
    });
  }

  let tmpPath = null;

  try {
    const { fields, files } = await parseForm(req);
    const file = files?.photo || files?.file;
    const f = Array.isArray(file) ? file[0] : file;
    if (!f?.filepath) {
      return res.status(400).json({ error: 'No photo file provided' });
    }
    tmpPath = f.filepath;

    if (!ALLOWED_TYPES.includes(f.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' });
    }

    const ext = f.originalFilename?.split('.').pop() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext.toLowerCase()) ? ext : 'jpg';
    const isProfile = (fields?.for || fields?.type)?.[0] === 'profile' || fields?.for === 'profile' || fields?.type === 'profile';
    const fileName = isProfile
      ? `profile/${user.id}/avatar.${safeExt}`
      : `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const buffer = await readFile(tmpPath);
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: f.mimetype,
        upsert: isProfile,
      });

    await unlink(tmpPath).catch(() => {});

    if (error) {
      if (error.message?.includes('Bucket not found')) {
        return res.status(500).json({
          error: 'Storage bucket not set up. Create a bucket named "truck-photos" in Supabase Dashboard > Storage.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
    return res.json({ ok: true, url: urlData.publicUrl });
  } catch (err) {
    if (tmpPath) {
      await unlink(tmpPath).catch(() => {});
    }
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
}
