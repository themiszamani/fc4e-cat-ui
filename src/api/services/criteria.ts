import { AxiosError } from "axios";
import { APIClient } from "@/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { handleBackendError } from "@/utils";
import {
  ApiOptions,
  Criterion,
  CriterionInput,
  CriterionResponse,
  CriterionTypeResponse,
  ImperativeResponse,
} from "@/types";

export const useGetCriteria = ({
  size,
  page,
  token,
  isRegistered,
}: ApiOptions) =>
  useQuery({
    queryKey: ["criteria", { size, page }],
    queryFn: async () => {
      const response = await APIClient(token).get<CriterionResponse>(
        `/registry/criteria?size=${size}&page=${page}`,
      );
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered,
  });

export const useGetCriterion = ({
  id,
  token,
  isRegistered,
}: {
  id: string;
  token: string;
  isRegistered: boolean;
}) =>
  useQuery({
    queryKey: ["criterion", id],
    queryFn: async () => {
      let response = null;

      response = await APIClient(token).get<Criterion>(
        `/registry/criteria/${id}`,
      );
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered && id !== "" && id !== undefined,
  });

export const useGetAllCriteria = ({ token, isRegistered, size }: ApiOptions) =>
  useInfiniteQuery({
    queryKey: ["all-criteria"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await APIClient(token).get<CriterionResponse>(
        `/registry/criteria?size=${size}&page=${pageParam}`,
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.number_of_page < lastPage.total_pages) {
        return lastPage.number_of_page + 1;
      } else {
        return undefined;
      }
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    retry: false,
    enabled: isRegistered,
  });

export const useGetAllImperatives = ({
  token,
  isRegistered,
  size,
}: ApiOptions) =>
  useInfiniteQuery({
    queryKey: ["all-imperatives"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await APIClient(token).get<ImperativeResponse>(
        `/registry/imperatives?size=${size}&page=${pageParam}`,
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.number_of_page < lastPage.total_pages) {
        return lastPage.number_of_page + 1;
      } else {
        return undefined;
      }
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    retry: false,
    enabled: isRegistered,
  });

export const useCreateCriterion = (
  token: string,
  { cri, label, description, imperative, type_criterion_id }: CriterionInput,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    async () => {
      const response = await APIClient(token).post<CriterionResponse>(
        `/registry/criteria`,
        {
          cri,
          label,
          description,
          imperative,
          type_criterion_id,
        },
      );
      return response.data;
    },

    {
      onError: (error: AxiosError) => {
        return handleBackendError(error);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["criteria"]);
      },
    },
  );
};

export const useGetAllCriterionTypes = ({
  token,
  isRegistered,
  size,
}: ApiOptions) =>
  useInfiniteQuery({
    queryKey: ["motivation-types"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await APIClient(token).get<CriterionTypeResponse>(
        `/registry/criterion-types?size=${size}&page=${pageParam}`,
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.number_of_page < lastPage.total_pages) {
        return lastPage.number_of_page + 1;
      } else {
        return undefined;
      }
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    retry: false,
    enabled: isRegistered,
  });

export const useUpdateCriterion = (
  token: string,
  id: string,
  { cri, label, description }: CriterionInput,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    async () => {
      const response = await APIClient(token).patch<CriterionResponse>(
        `/registry/criteria/${id}`,
        {
          cri,
          label,
          description,
        },
      );
      return response.data;
    },

    {
      onError: (error: AxiosError) => {
        return handleBackendError(error);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["criterion", id]);
      },
    },
  );
};

export function useDeleteCriterion(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (criterionId: string) => {
      return APIClient(token).delete(`/registry/criteria/${criterionId}`);
    },
    // on success refresh criteria query (so that the deleted criterion dissapears from list)
    onSuccess: () => {
      queryClient.invalidateQueries(["criterion"]);
    },
  });
}