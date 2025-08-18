import axios from 'axios';
import { createLogger } from '#lib/logger';
import { secrets, config } from '#lib/env';

const logger = createLogger({ module: 'vision-client' });

export const VisionClient = {
  refreshMetadata: async (tokenId: string, contract: string) => {
    const url = `${config.VISION_API_URL}/v1/name/refresh`;
    logger.info({ tokenId, contract }, 'Refreshing metadata for tokenId');

    const response = await axios.post(
      url,
      {
        tokenId,
        contract,
      },
      {
        headers: {
          'content-type': 'application/json',
          'x-api-key': secrets.VISION_API_KEY,
        },
      },
    );

    return response.data;
  },
};
