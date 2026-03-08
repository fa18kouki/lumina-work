import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ROLE_KEY."
    );
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  return supabaseAdmin;
}

export const CAST_PHOTOS_BUCKET = "cast-photos";
export const CHAT_MESSAGES_BUCKET = "chat-messages";
export const STORE_PHOTOS_BUCKET = "store-photos";

const ensuredBuckets = new Set<string>();

async function ensureBucketExists(bucketName: string): Promise<void> {
  if (ensuredBuckets.has(bucketName)) return;

  const client = getSupabaseAdminClient();
  const { data } = await client.storage.getBucket(bucketName);

  if (!data) {
    await client.storage.createBucket(bucketName, {
      public: true,
    });
  }

  ensuredBuckets.add(bucketName);
}

/**
 * キャスト写真をSupabase Storageにアップロード
 * @param file ファイル
 * @param castId キャストID
 * @returns アップロードされた写真のURL
 */
export async function uploadCastPhoto(
  file: File,
  castId: string
): Promise<string> {
  await ensureBucketExists(CAST_PHOTOS_BUCKET);
  const client = getSupabaseAdminClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${castId}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(CAST_PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(CAST_PHOTOS_BUCKET).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * キャスト写真を削除
 * @param url 写真のURL
 */
export async function deleteCastPhoto(url: string): Promise<void> {
  const client = getSupabaseAdminClient();

  // URLからパスを抽出
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split(`/${CAST_PHOTOS_BUCKET}/`);
  if (pathParts.length !== 2) {
    throw new Error("Invalid photo URL");
  }

  const { error } = await client.storage
    .from(CAST_PHOTOS_BUCKET)
    .remove([pathParts[1]]);

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}

/**
 * 署名付きアップロードURL生成（サーバーサイド用）
 * @param castId キャストID
 * @param fileExt ファイル拡張子
 * @returns 署名付きアップロードURL
 */
export async function createSignedUploadUrl(
  castId: string,
  fileExt: string
): Promise<{ signedUrl: string; path: string }> {
  await ensureBucketExists(CAST_PHOTOS_BUCKET);
  const client = getSupabaseAdminClient();
  const fileName = `${castId}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(CAST_PHOTOS_BUCKET)
    .createSignedUploadUrl(fileName);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

/**
 * パスから公開URLを取得
 * @param path ファイルパス
 * @returns 公開URL
 */
export function getPublicUrl(path: string): string {
  const client = getSupabaseClient();
  const {
    data: { publicUrl },
  } = client.storage.from(CAST_PHOTOS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * チャット画像用の署名付きアップロードURL生成
 */
export async function createSignedChatUploadUrl(
  matchId: string,
  fileExt: string
): Promise<{ signedUrl: string; path: string }> {
  await ensureBucketExists(CHAT_MESSAGES_BUCKET);
  const client = getSupabaseAdminClient();
  const fileName = `${matchId}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(CHAT_MESSAGES_BUCKET)
    .createSignedUploadUrl(fileName);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

/**
 * チャット画像の公開URLを取得
 */
export function getChatPublicUrl(path: string): string {
  const client = getSupabaseClient();
  const {
    data: { publicUrl },
  } = client.storage.from(CHAT_MESSAGES_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * 診断用画像の署名付きアップロードURL生成
 */
export async function createSignedDiagnosisUploadUrl(
  sessionId: string,
  fileExt: string
): Promise<{ signedUrl: string; path: string }> {
  await ensureBucketExists(CAST_PHOTOS_BUCKET);
  const client = getSupabaseAdminClient();
  const fileName = `diagnosis/${sessionId}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(CAST_PHOTOS_BUCKET)
    .createSignedUploadUrl(fileName);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

/**
 * 診断用画像の公開URLを取得
 */
export function getDiagnosisPublicUrl(path: string): string {
  const client = getSupabaseClient();
  const {
    data: { publicUrl },
  } = client.storage.from(CAST_PHOTOS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * 店舗写真用の署名付きアップロードURL生成
 */
export async function createSignedStoreUploadUrl(
  storeId: string,
  fileExt: string
): Promise<{ signedUrl: string; path: string }> {
  await ensureBucketExists(STORE_PHOTOS_BUCKET);
  const client = getSupabaseAdminClient();
  const fileName = `${storeId}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(STORE_PHOTOS_BUCKET)
    .createSignedUploadUrl(fileName);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

/**
 * 店舗写真の公開URLを取得
 */
export function getStorePublicUrl(path: string): string {
  const client = getSupabaseClient();
  const {
    data: { publicUrl },
  } = client.storage.from(STORE_PHOTOS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * 店舗写真を削除
 */
export async function deleteStorePhoto(url: string): Promise<void> {
  const client = getSupabaseAdminClient();

  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split(`/${STORE_PHOTOS_BUCKET}/`);
  if (pathParts.length !== 2) {
    throw new Error("Invalid photo URL");
  }

  const { error } = await client.storage
    .from(STORE_PHOTOS_BUCKET)
    .remove([pathParts[1]]);

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}
