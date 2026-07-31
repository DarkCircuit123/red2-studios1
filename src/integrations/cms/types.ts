export interface CmsItem {
  _id: string;
  [key: string]: any;
}

export interface CmsQueryResult<T> {
  items: T[];
  totalCount: number;
  hasNext: boolean;
  currentPage: number;
  pageSize: number;
  nextSkip: number | null;
}
