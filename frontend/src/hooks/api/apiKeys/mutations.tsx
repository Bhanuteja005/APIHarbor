import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { apiKeysQueryKeys } from "./queries";
import {
  TApiKey,
  TApiKeyUsageEntry,
  TApiKeyValidationResult,
  TCreateApiKeyDto,
  TDeleteApiKeyDto,
  TRecordApiKeyUsageDto,
  TRevealApiKeyDto,
  TUpdateApiKeyDto,
  TValidateApiKeyDto
} from "./types";

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation<{ apiKey: TApiKey }, object, TCreateApiKeyDto>({
    mutationFn: async (dto) => {
      const { data } = await apiRequest.post("/api/v1/api-keys", dto);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.list(projectId) });
    }
  });
};

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation<{ apiKey: TApiKey }, object, TUpdateApiKeyDto>({
    mutationFn: async ({ apiKeyId, projectId: _projectId, ...body }) => {
      const { data } = await apiRequest.patch(`/api/v1/api-keys/${apiKeyId}`, body);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: [...apiKeysQueryKeys.all, "spend", { projectId }] });
    }
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation<{ apiKey: TApiKey }, object, TDeleteApiKeyDto>({
    mutationFn: async ({ apiKeyId }) => {
      const { data } = await apiRequest.delete(`/api/v1/api-keys/${apiKeyId}`);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.list(projectId) });
    }
  });
};

export const useValidateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation<{ apiKey: TApiKey; result: TApiKeyValidationResult }, object, TValidateApiKeyDto>({
    mutationFn: async ({ apiKeyId }) => {
      const { data } = await apiRequest.post(`/api/v1/api-keys/${apiKeyId}/validate`);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.list(projectId) });
    }
  });
};

export const useRevealApiKey = () =>
  useMutation<{ value: string }, object, TRevealApiKeyDto>({
    mutationFn: async ({ apiKeyId }) => {
      const { data } = await apiRequest.post(`/api/v1/api-keys/${apiKeyId}/reveal`);
      return data;
    }
  });

export const useRecordApiKeyUsage = () => {
  const queryClient = useQueryClient();
  return useMutation<{ usage: TApiKeyUsageEntry }, object, TRecordApiKeyUsageDto>({
    mutationFn: async ({ apiKeyId, projectId: _projectId, ...body }) => {
      const { data } = await apiRequest.post(`/api/v1/api-keys/${apiKeyId}/usage`, body);
      return data;
    },
    onSuccess: (_, { apiKeyId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: [...apiKeysQueryKeys.all, "spend", { projectId }] });
      queryClient.invalidateQueries({ queryKey: [...apiKeysQueryKeys.all, "usage", { apiKeyId }] });
    }
  });
};
