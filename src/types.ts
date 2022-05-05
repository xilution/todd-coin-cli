export interface ApiData<T> {
  id: string;
  attributes: Omit<T, "id">;
  relationships: Record<
    string,
    { data: ApiData<unknown> | Array<ApiData<unknown>> }
  >;
}
