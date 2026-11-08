'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Layers,
  Search,
} from 'lucide-react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch todos from API
  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Handle Add Todo
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [newTodo, ...prev]);
        setTitle('');
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Completed
  const handleToggle = async (id: number, currentCompleted: boolean) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !currentCompleted } : t))
    );

    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert on failure
      fetchTodos();
    }
  };

  // Handle Delete Todo
  const handleDelete = async (id: number) => {
    // Optimistic delete
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete todo:', err);
      fetchTodos();
    }
  };

  // Filtered Todos
  const filteredTodos = useMemo(() => {
    return todos.filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === 'pending') return !item.completed;
      if (filter === 'completed') return item.completed;
      return true;
    });
  }, [todos, searchQuery, filter]);

  // Statistics
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="min-h-screen bg-[#faf7f8] text-slate-800 antialiased font-sans flex flex-col justify-between">
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        
        {/* Header Section */}
        <header className="mb-8">
          <div className="border-b border-pink-100/80 pb-5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Task Management
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3.5 sm:gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-xs font-medium text-slate-500">Total Entries</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{totalCount}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-xs font-medium text-pink-700">Pending Tasks</div>
              <div className="text-2xl font-semibold text-pink-600 mt-1">{pendingCount}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-xs font-medium text-slate-500">Completed</div>
              <div className="text-2xl font-semibold text-slate-700 mt-1">{completedCount}</div>
            </div>
          </div>
        </header>

        {/* Input Card */}
        <section className="bg-white rounded-2xl border border-pink-100/90 shadow-[0_2px_8px_rgba(236,72,153,0.04)] p-4 sm:p-5 mb-6">
          <form onSubmit={handleAdd} className="flex gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tambahkan tugas baru..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 text-sm text-slate-800 placeholder:text-slate-400 transition"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition shadow-[0_1px_2px_rgba(219,39,119,0.2)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </form>
        </section>

        {/* Task List Header & Filters */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-white text-pink-700 shadow-sm font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'pending'
                    ? 'bg-white text-pink-700 shadow-sm font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Belum Selesai ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'completed'
                    ? 'bg-white text-pink-700 shadow-sm font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Selesai ({completedCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tugas..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 bg-white"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] divide-y divide-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Memuat data dari server...
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Layers className="w-8 h-8 mx-auto text-pink-300 stroke-[1.5] mb-2" />
                <p className="text-sm font-medium text-slate-700">Tidak ada tugas</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan form di atas atau kirim request via Locust untuk menambah data.
                </p>
              </div>
            ) : (
              filteredTodos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 sm:px-4 sm:py-3.5 hover:bg-pink-50/20 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggle(item.id, item.completed)}
                      className="text-slate-300 hover:text-pink-600 transition flex-shrink-0 cursor-pointer"
                      title={item.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-pink-600 fill-pink-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-pink-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm tracking-tight truncate ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span>ID: #{item.id}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex-shrink-0 ml-2"
                    title="Hapus data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>


      </main>

      <footer className="w-full border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        Task Management
      </footer>
    </div>
  );
}
