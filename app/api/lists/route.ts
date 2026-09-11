import { NextResponse } from 'next/server'
import { getAllLists, createList, deleteList } from '@/lib/db-operations'
import type { CreateListData } from '@/lib/types'

export async function GET() {
  try {
    const lists = getAllLists()
    return NextResponse.json(lists)
  } catch (error) {
    console.error('Error fetching lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateListData = await request.json()
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      )
    }

    const list = createList(data)
    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    console.error('Error creating list:', error)
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { listId } = await request.json()
    
    if (!listId) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      )
    }

    deleteList(listId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting list:', error)
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    )
  }
}