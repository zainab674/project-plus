"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotebookPen, Plus, Pin, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const STORAGE_KEY = 'flexy_whitepage_entries';
const COLOR_OPTIONS = [
  { id: 'amber', label: 'Warm', chip: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200' },
  { id: 'emerald', label: 'Calm', chip: 'bg-emerald-100 text-emerald-800', ring: 'ring-emerald-200' },
  { id: 'sky', label: 'Focus', chip: 'bg-sky-100 text-sky-800', ring: 'ring-sky-200' },
  { id: 'violet', label: 'Deep', chip: 'bg-violet-100 text-violet-800', ring: 'ring-violet-200' },
  { id: 'slate', label: 'Neutral', chip: 'bg-slate-100 text-slate-800', ring: 'ring-slate-200' },
];

const COLOR_STYLES = {
  amber: {
    card: 'border-amber-200 bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-300',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/40',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-300',
  },
  sky: {
    card: 'border-sky-200 bg-sky-50/40',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-300',
  },
  violet: {
    card: 'border-violet-200 bg-violet-50/40',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-300',
  },
  slate: {
    card: 'border-slate-200 bg-slate-50/60',
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-400',
  },
};

const defaultFormState = {
  entry: '',
  color: COLOR_OPTIONS[0].id,
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.round(Math.random() * 10_000)}`;
};

export default function WhitePage() {
  const router = useRouter();
  const [formState, setFormState] = useState(defaultFormState);
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Unable to load WhitePage notes', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Unable to persist WhitePage notes', error);
    }
  }, [entries, isHydrated]);

  const handleTextChange = (event) => {
    setFormState((prev) => ({
      ...prev,
      entry: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState((prev) => ({
      ...defaultFormState,
      color: prev.color,
    }));
  };

  const handleCreateEntry = () => {
    const trimmedEntry = formState.entry.trim();
    if (!trimmedEntry) return;

    const newEntry = {
      id: createId(),
      text: trimmedEntry,
      color: formState.color,
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    setEntries((prev) => [newEntry, ...prev]);
    resetForm();
  };

  const handleDeleteEntry = (id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const togglePin = (id) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, pinned: !entry.pinned } : entry,
      ),
    );
  };

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const narrowed = entries.filter((entry) => {
      const matchesSearch =
        !normalizedSearch ||
        entry.text.toLowerCase().includes(normalizedSearch);
      return matchesSearch;
    });

    return narrowed.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [entries, searchTerm]);

  const handleDialogChange = (open) => {
    setIsOpen(open);
    if (!open) {
      router.push('/dashboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl w-full border-none bg-transparent p-0 shadow-none">
        <div className="mx-auto flex w-full flex-col gap-6 rounded-3xl border border-amber-100 bg-gradient-to-b from-white via-gray-50 to-gray-100 p-6 shadow-xl">
          <header className="rounded-3xl border border-amber-100 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                  <NotebookPen className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Personal Space
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900">WhitePage</h1>
                  <p className="text-sm text-gray-500">
                    Park ideas, reminders, and running notes just for you.
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 focus-within:ring focus-within:ring-amber-100 md:w-auto">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search notes"
                  className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Write something</h2>
                <p className="text-sm text-gray-500">
                  Keep it lightweight—just type and save when ready.
                </p>
              </div>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, color: color.id }))
                    }
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all focus:outline-none',
                      formState.color === color.id
                        ? `${color.chip} border-transparent ring-4 ${color.ring}`
                        : 'border-gray-200 bg-gray-50',
                    )}
                    aria-label={`Use ${color.label} palette`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={formState.entry}
                onChange={handleTextChange}
                placeholder="Capture a thought, todo, or reminder..."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-gray-800 placeholder:text-gray-400 focus:border-amber-200 focus:outline-none focus:ring focus:ring-amber-100"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateEntry}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 focus:outline-none focus:ring focus:ring-amber-200 disabled:opacity-50"
                  disabled={!formState.entry.trim()}
                >
                  <Plus className="h-4 w-4" />
                  Save note
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredEntries.length > 0 ? 'Your board' : 'No entries yet'}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredEntries.length > 0
                    ? 'Pinned items stay at the top.'
                    : 'Use the form above to start writing to yourself.'}
                </p>
              </div>
              {entries.length > 0 && (
                <span className="rounded-full bg-gray-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {entries.length} saved
                </span>
              )}
            </div>

            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center">
                <NotebookPen className="h-10 w-10 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Nothing here yet
                </h3>
                <p className="text-sm text-gray-500">
                  Capture quick to-dos, journaling prompts, or anything on your mind.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredEntries.map((entry) => {
                  const scheme = COLOR_STYLES[entry.color] ?? COLOR_STYLES.slate;
                  return (
                    <article
                      key={entry.id}
                      className={cn(
                        'flex h-full flex-col rounded-2xl border bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                        scheme.card,
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', scheme.dot)} />
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            {new Date(entry.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePin(entry.id)}
                            className="rounded-full border border-transparent p-1 text-gray-400 transition hover:border-amber-200 hover:text-amber-500"
                            aria-label={entry.pinned ? 'Unpin entry' : 'Pin entry'}
                          >
                            <Pin
                              className={cn('h-4 w-4', entry.pinned && 'text-amber-500')}
                              style={entry.pinned ? { fill: 'currentColor' } : undefined}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="rounded-full border border-transparent p-1 text-gray-400 transition hover:border-rose-200 hover:text-rose-500"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {entry.text}
                      </p>
                      {entry.pinned && (
                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Pin className="h-3 w-3" />
                          Pinned note
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}


