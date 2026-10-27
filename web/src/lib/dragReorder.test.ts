import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { moveItem, useDragReorder } from './dragReorder';

describe('moveItem', () => {
  it('memindahkan ke bawah dan ke atas', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('tidak mengubah array bila indeks sama atau di luar rentang', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, -1, 0)).toBe(items);
    expect(moveItem(items, 0, 2)).toBe(items);
  });

  it('tidak memodifikasi array asli', () => {
    const items = ['a', 'b', 'c'];
    moveItem(items, 0, 2);
    expect(items).toEqual(['a', 'b', 'c']);
  });
});

describe('useDragReorder', () => {
  const dragEvent = () => ({ preventDefault: vi.fn(), dataTransfer: { effectAllowed: '', dropEffect: '', setData: vi.fn() } }) as never;

  it('menyeret baris 0 ke baris 2 memanggil onMove(0, 2) dan membersihkan status', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));

    act(() => result.current.rowProps(0).onDragStart(dragEvent()));
    expect(result.current.dragIndex).toBe(0);

    act(() => result.current.rowProps(2).onDragOver(dragEvent()));
    expect(result.current.dropEdge(2)).toBe('bottom');
    expect(result.current.dropEdge(0)).toBeNull();

    act(() => result.current.rowProps(2).onDrop(dragEvent()));
    expect(onMove).toHaveBeenCalledWith(0, 2);
    expect(result.current.dragIndex).toBeNull();
    expect(result.current.dropEdge(2)).toBeNull();
  });

  it('menarik ke atas menandai sisi atas; DragEnd tanpa drop membatalkan', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));
    act(() => result.current.rowProps(3).onDragStart(dragEvent()));
    act(() => result.current.rowProps(1).onDragOver(dragEvent()));
    expect(result.current.dropEdge(1)).toBe('top');
    act(() => result.current.rowProps(1).onDragEnd());
    expect(onMove).not.toHaveBeenCalled();
    expect(result.current.dragIndex).toBeNull();
  });

  it('mengabaikan seretan dari luar (bukan baris daftar ini)', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));
    const e = dragEvent();
    act(() => result.current.rowProps(1).onDragOver(e));
    act(() => result.current.rowProps(1).onDrop(e));
    expect(onMove).not.toHaveBeenCalled();
    expect((e as unknown as { preventDefault: () => void }).preventDefault).not.toHaveBeenCalled();
  });
});
