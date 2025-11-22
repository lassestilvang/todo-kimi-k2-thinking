import { NextRequest, NextResponse } from 'next/server';
import * as listsService from '@/lib/services/lists';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const list = listsService.getListById(id);
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    const list = listsService.updateList(id, data);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    listsService.deleteList(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
