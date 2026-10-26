import { useState } from 'react';
import type { DragEvent } from 'react';

/** Memindahkan satu item ke indeks baru; mengembalikan array yang sama bila tidak ada perubahan. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Seret-lepas untuk mengurutkan daftar (HTML5 drag & drop, tanpa library).
 * `rowProps(i)` dipasang di setiap baris; `dropEdge(i)` memberi tahu sisi mana yang perlu garis penanda.
 */
export function useDragReorder(onMove: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const rowProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index)); // Firefox butuh data agar seretan dimulai
    },
    onDragOver: (e: DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== index) setOverIndex(index);
    },
    onDrop: (e: DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      const from = dragIndex;
      reset();
      onMove(from, index);
    },
    onDragEnd: reset,
  });

  /** Sisi baris yang ditandai saat diseret melewatinya: 'top' bila ditarik ke atas, 'bottom' bila ke bawah. */
  const dropEdge = (index: number): 'top' | 'bottom' | null =>
    dragIndex !== null && overIndex === index && dragIndex !== index ? (dragIndex < index ? 'bottom' : 'top') : null;

  return { rowProps, dropEdge, dragIndex };
}
