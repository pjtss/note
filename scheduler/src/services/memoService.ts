import { Memo, CreateMemoInput, UpdateMemoInput } from '../types/memo';
import { supabase } from './supabaseClient';
import { isBrowser } from './scheduleService';

export interface IMemoService {
  getMemos(): Promise<Memo[]>;
  createMemo(input: CreateMemoInput): Promise<Memo>;
  updateMemo(id: string, input: UpdateMemoInput): Promise<Memo>;
  deleteMemo(id: string): Promise<void>;
}

// 1. LocalStorage 기반 메모 서비스 구현 (프리미엄 로컬 Fallback)
export class LocalStorageMemoService implements IMemoService {
  private STORAGE_KEY = 'scheduler_memos';

  private getRawMemos(): Memo[] {
    if (!isBrowser.check()) return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      // 초기 프리미엄 감성 데모 메모 탑재
      const demoData: Memo[] = [
        {
          id: 'demo-memo-1',
          title: '💡 Antigravity 프리미엄 메모패드',
          content: '일정 관리와 유기적으로 결합된 프리미엄 메모 핀보드입니다. 마이크로 호버 애니메이션과 파스텔톤 다채로운 색상으로 영감을 기록하세요!',
          color: '#ffd166', // 노랑 파스텔
          isDeleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-memo-2',
          title: '🎨 디자인 영감 및 HSL 색상표',
          content: '메모 카드의 우측 하단 팔레트 버튼을 눌러보세요. HSL 기반의 세련된 조화로운 색상 스펙트럼으로 카드 감성을 손쉽게 변경할 수 있습니다.',
          color: '#a8dadc', // 하늘색 파스텔
          isDeleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-memo-3',
          title: '⚡ 실시간 클라우드 Supabase 싱크',
          content: '배포 환경변수가 장착되는 즉시, 모든 메모는 Supabase 클라우드 데이터베이스와 0.1초 만에 실시간 양방향 싱크되어 안전하게 보존됩니다.',
          color: '#bdb2ff', // 연보라 파스텔
          isDeleted: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(demoData));
      return demoData;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveRawMemos(memos: Memo[]) {
    if (!isBrowser.check()) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memos));
  }

  async getMemos(): Promise<Memo[]> {
    return this.getRawMemos().filter(m => !m.isDeleted);
  }

  async createMemo(input: CreateMemoInput): Promise<Memo> {
    const memos = this.getRawMemos();
    const newMemo: Memo = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      content: input.content,
      color: input.color,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    memos.push(newMemo);
    this.saveRawMemos(memos);
    return newMemo;
  }

  async updateMemo(id: string, input: UpdateMemoInput): Promise<Memo> {
    const memos = this.getRawMemos();
    const idx = memos.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('메모를 찾을 수 없습니다.');

    memos[idx] = {
      ...memos[idx],
      ...input
    };
    this.saveRawMemos(memos);
    return memos[idx];
  }

  async deleteMemo(id: string): Promise<void> {
    const memos = this.getRawMemos();
    const updated = memos.map(m => m.id === id ? { ...m, isDeleted: true } : m);
    this.saveRawMemos(updated);
  }
}

// 2. Supabase 클라우드 SDK 기반 실시간 메모 연동 서비스 구현
export class SupabaseMemoService implements IMemoService {
  async getMemos(): Promise<Memo[]> {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.userId,
      title: item.title,
      content: item.content || '',
      color: item.color || '#2b2d42',
      isDeleted: item.isDeleted || false,
      createdAt: item.createdAt
    }));
  }

  async createMemo(input: CreateMemoInput): Promise<Memo> {
    const { data, error } = await supabase
      .from('memos')
      .insert([
        {
          id: crypto.randomUUID(), // 클라이언트 사이드 자율 할당으로 Not Null 완벽 수호
          userId: input.userId,
          title: input.title,
          content: input.content,
          color: input.color,
          isDeleted: false
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      content: data.content || '',
      color: data.color || '#2b2d42',
      isDeleted: data.isDeleted || false,
      createdAt: data.createdAt
    };
  }

  async updateMemo(id: string, input: UpdateMemoInput): Promise<Memo> {
    const { data, error } = await supabase
      .from('memos')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      content: data.content || '',
      color: data.color || '#2b2d42',
      isDeleted: data.isDeleted || false,
      createdAt: data.createdAt
    };
  }

  async deleteMemo(id: string): Promise<void> {
    const { error } = await supabase
      .from('memos')
      .update({ isDeleted: true })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

// 3. DI 팩토리 패턴 탑재
export function getMemoService(): IMemoService {
  if (isBrowser.check()) {
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    if (currentUrl && currentAnonKey) {
      console.log('클라우드 Supabase API 메모 연동 활성화: SupabaseMemoService 기동');
      return new SupabaseMemoService();
    }
  }
  console.log('로컬 스탠드얼론 모드: LocalStorageMemoService 활성화 (메모)');
  return new LocalStorageMemoService();
}
