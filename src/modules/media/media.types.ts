export type MediaType = 'IMAGE';

export type MediaRole = 'PRIMARY' | 'GALLERY' | 'THUMBNAIL' | 'BANNER' | 'OG';

export interface CreateFolderInput {
  name: string;
  slug?: string;
  parentId?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface MediaFolderResponse {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: MediaFolderResponse | null;
  children?: MediaFolderResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadMediaInput {
  title?: string;
  altText?: string;
  caption?: string;
  folderId?: string | null;
}

export interface UpdateMediaInput {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  folderId?: string | null;
}

export interface MediaFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
  mimeType?: string;
  mediaType?: MediaType;
  isOrphan?: boolean;
  sortBy?: 'createdAt' | 'fileSize' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaAssetResponse {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  mimeType: string;
  mediaType: MediaType;
  fileSize: number;
  width: number | null;
  height: number | null;
  checksum: string;
  title: string | null;
  altText: string | null;
  caption: string | null;
  folderId: string | null;
  folder?: MediaFolderResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachEntityMediaInput {
  mediaId: string;
  sortOrder?: number;
  isPrimary?: boolean;
  role?: MediaRole;
}

export interface ReorderEntityMediaInput {
  items: Array<{
    mediaId: string;
    sortOrder: number;
  }>;
}

export interface EntityMediaItemResponse {
  mediaId: string;
  sortOrder: number;
  isPrimary: boolean;
  role: MediaRole;
  createdAt: string;
  media: MediaAssetResponse;
}

export interface PublicMediaItem {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  role: MediaRole;
  isPrimary: boolean;
}
