import { Search as DefaultSearch } from '@/components/search';
import {
  getOriginConfig,
  getOriginFromServerHeaders,
  getOriginInfo,
} from '@/lib/origin';
import { headers } from 'next/headers';

export default async function HomePage() {
  const headersList = await headers();
  const origin = getOriginFromServerHeaders(headersList);

  // TODO: (sid) - handle the case where the origin is not found
  if (!origin) {
    return null;
  }

  const originInfo = getOriginInfo(origin);
  const config = getOriginConfig(origin);
  const SearchComponent = config.landingPage?.component || DefaultSearch;

  return (
    <div className="p-4">
      <SearchComponent originInfo={originInfo} />
    </div>
  );
}
