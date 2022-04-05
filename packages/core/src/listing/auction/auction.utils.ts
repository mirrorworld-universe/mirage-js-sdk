import {
  Endpoint,
  getTokenListContainerPromise,
} from '@mirrorworld/mirage.utils';
import { TokenInfo } from '@solana/spl-token-registry';

export async function getTokenListByNetwork(
  endpoint: Endpoint
): Promise<Map<string, TokenInfo>> {
  const tokenList = getTokenListContainerPromise().then((container) => {
    const list = container
      .excludeByTag('nft')
      .filterByChainId(endpoint.chainId)
      .getList();

    const map = new Map(list.map((item) => [item.address, item]));
    return map;
  });

  return tokenList;
}
