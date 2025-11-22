import { NextRequest, NextResponse } from 'next/server';
import * as labelsService from '@/lib/services/labels';

export async function GET() {
  try {
    const labels = labelsService.getAllLabels();
    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const label = labelsService.createLabel(data);
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}
