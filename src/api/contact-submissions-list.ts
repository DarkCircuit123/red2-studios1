import { BaseCrudService } from '@/integrations';
import { ContactSubmissions } from '@/entities';

export async function GET() {
  try {
    const result = await BaseCrudService.getAll<ContactSubmissions>('contactsubmissions', {}, { limit: 100 });
    
    return new Response(
      JSON.stringify({
        success: true,
        items: result.items || [],
        totalCount: result.totalCount || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Contact Submissions List] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch contact submissions',
        items: [],
        totalCount: 0,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PATCH({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { _id, status } = body;

    if (!_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing submission ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await BaseCrudService.update<ContactSubmissions>('contactsubmissions', {
      _id,
      status,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Submission updated',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Contact Submissions Update] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update submission',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { _id } = body;

    if (!_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing submission ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await BaseCrudService.delete('contactsubmissions', _id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Submission deleted',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Contact Submissions Delete] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete submission',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

