"use client";

import { useState } from 'react';
import { Memo } from '../types/memo';
import { createSlashSuggestions as createSlashSuggestionsUtil } from '../lib/editorUi';

type UseMemoFormProps = {
  addMemo: (memo: any) => Promise<any>;
  editMemo: (id: string, memo: any) => Promise<any>;
  userId: string | undefined;
  setIsMemoModalOpen: (open: boolean) => void;
  showToast: (message: string) => void;
};

export function useMemoForm({
  addMemo,
  editMemo,
  userId,
  setIsMemoModalOpen,
  showToast
}: UseMemoFormProps) {
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoColor, setMemoColor] = useState('#fffbeb'); // 기본 파스텔 코지옐로우
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [slashSuggestions, setSlashSuggestions] = useState<Array<{ label: string; insert: string }>>([]);
  const [selectedSlashSuggestionIndex, setSelectedSlashSuggestionIndex] = useState(0);

  const updateSlashSuggestions = (value: string, cursorPos: number) => {
    setSlashSuggestions(createSlashSuggestionsUtil(value, cursorPos));
    setSelectedSlashSuggestionIndex(0);
  };

  const handleMemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitle.trim()) return;

    try {
      if (editingMemoId) {
        await editMemo(editingMemoId, {
          title: memoTitle,
          content: memoContent,
          color: memoColor
        });
        setEditingMemoId(null);
      } else {
        await addMemo({
          title: memoTitle,
          content: memoContent,
          color: memoColor,
          userId
        } as any);
      }

      setMemoTitle('');
      setMemoContent('');
      setMemoColor('#fffbeb');
      setIsMemoModalOpen(false);
    } catch (err) {
      // 에러 자동 처리
    }
  };

  const handleSaveMemoOnly = async () => {
    if (!editingMemoId || !memoTitle.trim()) return;
    try {
      await editMemo(editingMemoId, {
        title: memoTitle,
        content: memoContent,
        color: memoColor
      });
      showToast('💾 메모 변경 사항이 저장되었습니다.');
    } catch (err) {
      showToast('❌ 메모 저장 중 오류가 발생했습니다.');
    }
  };

  const handleStartMemoEdit = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setMemoTitle(memo.title);
    setMemoContent(memo.content || '');
    setMemoColor(memo.color || '#fffbeb');
    setIsMemoModalOpen(true);
  };

  const handleCancelMemoEdit = () => {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoColor('#fffbeb');
    setSlashSuggestions([]);
    setIsMemoModalOpen(false);
  };

  const insertSlashCommand = (insertText: string) => {
    const textarea = document.getElementById('memoContent') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const value = textarea.value;
    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    const slashIndex = textBeforeCursor.lastIndexOf('/');
    if (slashIndex < 0) return;

    const nextValue = value.slice(0, slashIndex) + insertText + value.slice(selectionEnd);
    setMemoContent(nextValue);
    setSlashSuggestions([]);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(slashIndex + insertText.length, slashIndex + insertText.length);
    }, 0);
  };

  const handleMemoContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashSuggestionIndex((prev) => (prev + 1) % slashSuggestions.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashSuggestionIndex((prev) => (prev - 1 + slashSuggestions.length) % slashSuggestions.length);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashSuggestions([]);
        return;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = slashSuggestions[selectedSlashSuggestionIndex];
        if (!selected) return;
        insertSlashCommand(selected.insert);
        return;
      }
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const textarea = e.currentTarget;
      const value = textarea.value;
      const selectionStart = textarea.selectionStart;
      
      const textBeforeCursor = value.substring(0, selectionStart);
      
      if (textBeforeCursor.endsWith('/checkbox')) {
        e.preventDefault(); // 스페이스나 엔터 자체 입력 차단
        
        const startPos = selectionStart - 9; // '/checkbox'.length = 9
        const endPos = selectionStart;
        
        const newValue = value.substring(0, startPos) + '- [ ] ' + (e.key === 'Enter' ? '\n' : '') + value.substring(endPos);
        setMemoContent(newValue);
        
        const newCursorPos = startPos + 6 + (e.key === 'Enter' ? 1 : 0); // '- [ ] '.length = 6
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  const handleMemoContentChange = (value: string, cursorPos: number) => {
    setMemoContent(value);
    updateSlashSuggestions(value, cursorPos);
  };

  return {
    memoTitle,
    setMemoTitle,
    memoContent,
    setMemoContent,
    memoColor,
    setMemoColor,
    editingMemoId,
    setEditingMemoId,
    slashSuggestions,
    setSlashSuggestions,
    selectedSlashSuggestionIndex,
    setSelectedSlashSuggestionIndex,
    handleMemoSubmit,
    handleSaveMemoOnly,
    handleStartMemoEdit,
    handleCancelMemoEdit,
    handleMemoContentKeyDown,
    handleMemoContentChange,
    insertSlashCommand
  };
}
