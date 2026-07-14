import { supabase } from '../supabase'

const BUCKET = 'documents'

export async function uploadFile(path: string, file: File) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function removeFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}

export function uniquePath(prefix: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  return `${prefix}/${crypto.randomUUID()}-${safe}`
}
