import { useNavigate } from "react-router-dom";
import { APIClient } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiOptions,
  Assessment,
  AssessmentDetailsResponse,
  AssessmentFiltersType,
  AssessmentListResponse,
  AssessmentSubjectListResponse,
} from "@/types";
import { AxiosError } from "axios";
import { handleBackendError } from "@/utils";

export function useCreateAssessment(token: string) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (postData: {
      validation_id: number;
      template_id: number;
      assessment_doc: Assessment;
    }) => {
      return APIClient(token).post("/assessments", postData);
    },
    // for the time being redirect to assessment list
    onSuccess: () => {
      navigate("/assessments");
    },
  });
}

export function useUpdateAssessment(
  token: string,
  assessmentID: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (putData: { assessment_doc: Assessment }) => {
      return APIClient(token).put(`/assessments/${assessmentID}`, putData);
    },
    // optimistically update the cached data
    onMutate: (newData) => {
      // Optimistically update the cache with the new data
      if (assessmentID) {
        queryClient.setQueryData(["assessment", assessmentID], newData);
      }
    },
    // for the time being redirect to assessment list
    onSuccess: () => {
      queryClient.invalidateQueries(["assessment", { assessmentID }]);
    },
  });
}

export function useGetAssessments({
  size,
  page,
  sortBy,
  token,
  isRegistered,
  ...filters
}: ApiOptions & AssessmentFiltersType) {
  let url = `/assessments?size=${size}&page=${page}&sortby=${sortBy}`;
  Object.keys(filters).forEach((k: string) => {
    if (filters[k as keyof typeof filters] !== "") {
      url = url.concat(`&${k}=${filters[k as keyof typeof filters]}`);
    }
  });
  return useQuery({
    queryKey: ["assessments", { size, page, sortBy, ...filters }],
    queryFn: async () => {
      const response = await APIClient(token).get<AssessmentListResponse>(url);
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered,
  });
}

export function useGetPublicAssessments({
  size,
  page,
  sortBy,
  assessmentTypeId,
  actorId,
  ...filters
}: ApiOptions) {
  let url = `/assessments/by-type/${assessmentTypeId}/by-actor/${actorId}?size=${size}&page=${page}&sortby=${sortBy}`;
  Object.keys(filters).forEach((k: string) => {
    if (filters[k as keyof typeof filters] !== "") {
      url = url.concat(`&${k}=${filters[k as keyof typeof filters]}`);
    }
  });
  return useQuery({
    queryKey: ["public-owner-assessments", { size, page, sortBy, ...filters }],
    queryFn: async () => {
      const response = await APIClient().get<AssessmentListResponse>(url);
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
  });
}

export function useGetAssessment({
  id,
  token,
  isRegistered,
}: {
  id: string;
  token: string;
  isRegistered: boolean;
}) {
  return useQuery({
    queryKey: ["assessment", id],
    queryFn: async () => {
      const response = await APIClient(token).get<AssessmentDetailsResponse>(
        `/assessments/${id}`,
      );
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered && id !== "",
  });
}

export function useGetObjectsByActor({
  size,
  page,
  sortBy,
  token,
  isRegistered,
  actorId,
}: ApiOptions) {
  return useQuery({
    queryKey: ["objects", { size, page, sortBy, actorId }],
    queryFn: async () => {
      const response = await APIClient(
        token,
      ).get<AssessmentSubjectListResponse>(
        `/assessments/objects/by-actor/${actorId}?size=${size}&page=${page}&sortby=${sortBy}`,
      );
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered && actorId !== undefined,
  });
}

export function useGetObjects({ size, page, token, isRegistered }: ApiOptions) {
  return useQuery({
    queryKey: ["objects", { size, page }],
    queryFn: async () => {
      const response = await APIClient(
        token,
      ).get<AssessmentSubjectListResponse>(
        `/assessments/objects?size=${size}&page=${page}`,
      );
      return response.data;
    },
    onError: (error: AxiosError) => {
      return handleBackendError(error);
    },
    enabled: !!token && isRegistered,
  });
}
