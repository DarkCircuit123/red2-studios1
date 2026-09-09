import { BaseCrudService } from '@/integrations';

interface SiteSettingsPayload {
  _id?: string;
  siteName?: string;
  seoTitle?: string;
  seoDescription?: string;
  instagramLink?: string;
  twitterLink?: string;
  facebookLink?: string;
  linkedInLink?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor?: string;
}

/**
 * POST /api/cms/mutate-sitesettings
 * Creates or updates site settings
 * If _id is provided, updates the existing record
 * Otherwise, creates a new record
 */
export async function POST(request: Request) {
  try {
    const payload: SiteSettingsPayload = await request.json();

    // Validate required fields
    if (!payload.siteName || payload.siteName.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Site Name is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let result;

    if (payload._id) {
      // Update existing settings
      result = await BaseCrudService.update('sitesettings', {
        _id: payload._id,
        siteName: payload.siteName,
        seoTitle: payload.seoTitle || '',
        seoDescription: payload.seoDescription || '',
        instagramLink: payload.instagramLink || '',
        twitterLink: payload.twitterLink || '',
        facebookLink: payload.facebookLink || '',
        linkedInLink: payload.linkedInLink || '',
        contactEmail: payload.contactEmail || '',
        contactPhone: payload.contactPhone || '',
        primaryColor: payload.primaryColor || '#000000',
      });
    } else {
      // Create new settings
      const newId = crypto.randomUUID();
      result = await BaseCrudService.create('sitesettings', {
        _id: newId,
        siteName: payload.siteName,
        seoTitle: payload.seoTitle || '',
        seoDescription: payload.seoDescription || '',
        instagramLink: payload.instagramLink || '',
        twitterLink: payload.twitterLink || '',
        facebookLink: payload.facebookLink || '',
        linkedInLink: payload.linkedInLink || '',
        contactEmail: payload.contactEmail || '',
        contactPhone: payload.contactPhone || '',
        primaryColor: payload.primaryColor || '#000000',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[mutate-sitesettings] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
