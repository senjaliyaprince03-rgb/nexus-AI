"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DocumentItem, PaginatedResponse } from "@/types/api";

export function useDocuments(page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<DocumentItem>>({
    queryKey: ["documents", page, pageSize],
    queryFn: () =>
      api.get<PaginatedResponse<DocumentItem>>(
        `/api/documents/?page=${page}&page_size=${pageSize}`
      ),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const busy = items.some((d) => d.status === "pending" || d.status === "processing");
      return busy ? 3000 : false;
    },
  });
}

export function useInvalidateDocuments() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["documents"] });
}
