import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/todos - Mengambil seluruh data todo
export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/todos - Menambah data todo baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';

    if (!title) {
      return NextResponse.json(
        { error: 'Field title wajib diisi' },
        { status: 400 }
      );
    }

    const newTodo = await prisma.todo.create({
      data: {
        title,
        completed: Boolean(body.completed ?? false),
      },
    });

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
