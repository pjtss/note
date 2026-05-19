export interface Memo {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

export interface CreateMemoInput {
  title: string;
  content: string;
  color: string;
}

export interface UpdateMemoInput {
  title?: string;
  content?: string;
  color?: string;
}
