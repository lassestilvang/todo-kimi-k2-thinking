import { NextResponse } from 'next/server'
import { getAllLabels, createLabel, deleteLabel } from '@/lib/db-operations'
import type { CreateLabelData } from '@/lib/types'

export async function GET() {
  try {
    const labels = getAllLabels()
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateLabelData = await request.json()
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      )
    }

    const label = createLabel(data)
    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { labelId } = await request.json()
    
    if (!labelId) {
      return NextResponse.json(
        { error: 'Label ID is required' },
        { status: 400 }
      )
    }

    deleteLabel(labelId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    )
  }
}