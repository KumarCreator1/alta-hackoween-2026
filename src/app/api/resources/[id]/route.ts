import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateResource, deleteResource } from '@/db/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id, 10);

    const [resource] = await db.select().from(resources).where(eq(resources.id, resourceId));
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Failed to get resource:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    const body = await request.json();

    const state = await updateResource(resourceId, body);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to update resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id, 10);

    const state = await deleteResource(resourceId);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}

