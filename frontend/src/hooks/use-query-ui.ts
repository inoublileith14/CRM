interface QueryUiInput<T> {
  data: T | undefined;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
}

export function useQueryUiState<T>({
  data,
  isPending,
  isFetching,
  isError,
}: QueryUiInput<T>) {
  const hasData = data !== undefined;

  return {
    data,
    showInitialLoading: isPending,
    isRefreshing: isFetching && hasData,
    showError: isError && !hasData,
  };
}
