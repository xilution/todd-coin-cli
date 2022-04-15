export interface ApiData<T> {
  id: string;
  attributes: Omit<T, "id">;
  relationships: Record<string, ApiData<unknown> | Array<ApiData<unknown>>>;
}
