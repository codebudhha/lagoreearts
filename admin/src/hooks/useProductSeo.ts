import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seoApi, SeoMetadata, UpsertSeoPayload } from '../lib/api/seo';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useProductSeo(productId: string, enabled = true) {
  return useQuery<SeoMetadata | null>({
    queryKey: queryKeys.seo.detail('PRODUCT', productId),
    queryFn: () => seoApi.getMetadata('PRODUCT', productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useUpsertProductSeo() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: UpsertSeoPayload }) =>
      seoApi.upsertMetadata('PRODUCT', productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seo.detail('PRODUCT', variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Product search engine optimization settings updated.', {
        title: 'SEO Settings Saved',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to save SEO metadata.', {
        title: 'SEO Save Failed',
      });
    },
  });
}
