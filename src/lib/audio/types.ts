
'use client';

import type { AssetId } from '@/types';

/**
 * Defines a function signature for resolving an asset's ID and path from the manifest
 * into a fully-qualified URL that can be fetched. This allows for swapping between
 * local and cloud-based storage.
 */
export type AssetUrlResolver = (assetId: AssetId, assetPath: string) => string;
