export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  profile_pic: string;
  bio: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  text: string;
  media_url: string | null;
  level: number;
  created_at: string;
  // joined fields
  username?: string;
  profile_pic?: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at: string;
  username?: string;
  profile_pic?: string;
}

export interface Friendship {
  id: number;
  user1_id: number;
  user2_id: number;
  is_close: number;
  created_at: string;
}

export interface FriendRequest {
  id: number;
  from_id: number;
  to_id: number;
  type: 'friend' | 'close';
  created_at: string;
  from_username?: string;
  from_profile_pic?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  text: string;
  created_at: string;
  sender_username?: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
}

export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
}

// D1 types for Cloudflare
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: object;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// R2 types
interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
  };
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}
