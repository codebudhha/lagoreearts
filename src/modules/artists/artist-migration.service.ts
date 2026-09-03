import { prisma } from '../../database/prisma.ts';
import type { ArtistMigrationSummary } from './artists.types.ts';

const AMBIGUOUS_PATTERNS = [
  /^unknown$/i,
  /^anonymous$/i,
  /^unidentified$/i,
  /^traditional$/i,
  /^various$/i,
  /^attributed\s+to/i,
  /^school\s+of/i,
  /^circle\s+of/i,
  /^workshop\s+of/i,
  /^after\s+/i,
  /^possibly\s+/i,
  /^manner\s+of/i,
  /^follower\s+of/i,
  /^master\s+of\s+the/i,
  /^style\s+of/i
];

export class ArtistMigrationService {
  static isAmbiguousAttribution(text: string): boolean {
    if (!text || !text.trim()) return true;
    const clean = text.trim();
    return AMBIGUOUS_PATTERNS.some(pattern => pattern.test(clean));
  }

  static async migrateAntiqueAttributions(options: { dryRun?: boolean } = {}): Promise<ArtistMigrationSummary> {
    const isDryRun = options.dryRun !== false;

    const summary: ArtistMigrationSummary = {
      scanned: 0,
      matched: 0,
      alreadyLinked: 0,
      ambiguous: 0,
      skipped: 0,
      details: []
    };

    const antiqueProfiles = await prisma.antiqueProfile.findMany({
      include: { product: true }
    });

    for (const prof of antiqueProfiles) {
      summary.scanned++;
      const candidateName = prof.artistMaker?.trim() || prof.attribution?.trim();

      if (!candidateName) {
        summary.skipped++;
        summary.details.push({
          productId: prof.productId,
          productName: prof.product?.name || 'Unknown Product',
          artistMaker: prof.artistMaker || null,
          attribution: prof.attribution || null,
          status: 'SKIPPED',
          reason: 'No artistMaker or attribution field present'
        });
        continue;
      }

      if (this.isAmbiguousAttribution(candidateName)) {
        summary.ambiguous++;
        summary.details.push({
          productId: prof.productId,
          productName: prof.product?.name || 'Unknown Product',
          artistMaker: prof.artistMaker || null,
          attribution: prof.attribution || null,
          status: 'AMBIGUOUS',
          reason: `Candidate text "${candidateName}" matches historical ambiguity pattern`
        });
        continue;
      }

      // Look for an exact case-insensitive match on Artist.name
      const matchedArtist = await prisma.artist.findFirst({
        where: { name: candidateName }
      });

      if (!matchedArtist) {
        summary.skipped++;
        summary.details.push({
          productId: prof.productId,
          productName: prof.product?.name || 'Unknown Product',
          artistMaker: prof.artistMaker || null,
          attribution: prof.attribution || null,
          status: 'SKIPPED',
          reason: `No canonical Artist record found matching "${candidateName}"`
        });
        continue;
      }

      // Check if already linked in ProductArtist
      const existingLink = await prisma.productArtist.findUnique({
        where: {
          productId_artistId_role: {
            productId: prof.productId,
            artistId: matchedArtist.id,
            role: 'ARTIST'
          }
        }
      });

      if (existingLink) {
        summary.alreadyLinked++;
        summary.details.push({
          productId: prof.productId,
          productName: prof.product?.name || 'Unknown Product',
          artistMaker: prof.artistMaker || null,
          attribution: prof.attribution || null,
          status: 'ALREADY_LINKED',
          artistId: matchedArtist.id,
          artistName: matchedArtist.name,
          reason: 'Product is already linked to this artist'
        });
        continue;
      }

      // Match found and not linked
      summary.matched++;
      summary.details.push({
        productId: prof.productId,
        productName: prof.product?.name || 'Unknown Product',
        artistMaker: prof.artistMaker || null,
        attribution: prof.attribution || null,
        status: 'MATCHED',
        artistId: matchedArtist.id,
        artistName: matchedArtist.name,
        reason: isDryRun ? 'Identified safe match (dry run)' : 'Linked to canonical artist successfully'
      });

      if (!isDryRun) {
        await prisma.productArtist.create({
          data: {
            productId: prof.productId,
            artistId: matchedArtist.id,
            role: 'ARTIST',
            isPrimary: true,
            sortOrder: 0
          }
        });
      }
    }

    return summary;
  }
}
