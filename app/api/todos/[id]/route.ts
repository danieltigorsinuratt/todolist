import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/todos/[id] - Ambil satu data todo
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    console.error('Error fetching single todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/todos/[id] - Update status todo
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: { title?: string; completed?: boolean } = {};

    if (typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim();
    }
    if (typeof body.completed === 'boolean') {
      updateData.completed = body.completed;
    }

    const updated = await prisma.todo.update({
      where: { id: todoId },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Todo tidak ditemukan' }, { status: 404 });
    }
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - Menghapus data todo
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id: todoId },
    });

    return NextResponse.json(
      { success: true, message: `Todo ${todoId} berhasil dihapus` },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Todo tidak ditemukan' }, { status: 404 });
    }
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
