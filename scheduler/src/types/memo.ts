export interface Memo {
  id: string;
  userId?: string; // 다중 사용자 격리를 위한 외래 키
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

export interface CreateMemoInput {
  title: string;
  content: string;
  color: string;
  userId?: string;
}

export interface UpdateMemoInput {
  title?: string;
  content?: string;
  color?: string;
  userId?: string;
}
