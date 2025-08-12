// src/app/(app)/search/page.tsx

import Link from 'next/link';
import { UserIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/solid';
import SearchPageClient from '../../../components/SearchPageClient';

interface SearchResult {
  _id: string;
  name?: string;
  content?: string;
  description?: string;
  type: 'user' | 'post' | 'group';
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getSearchResults(query: string, type: string = 'all'): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/search?q=${encodeURIComponent(query)}&type=${type}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch search results', error);
    return [];
  }
}

const ResultItem = ({ result }: { result: SearchResult }) => {
  const getIcon = () => {
    switch (result.type) {
      case 'user':
        return <UserIcon className="h-6 w-6 text-blue-400" />;
      case 'post':
        return <DocumentTextIcon className="h-6 w-6 text-green-400" />;
      case 'group':
        return <UsersIcon className="h-6 w-6 text-yellow-400" />;
    }
  };

  const getTitle = () => result.name || result.content?.substring(0, 100) || 'Result';
  const getDescription = () => result.description || result.content || '';
  const getLink = () => {
    switch (result.type) {
      case 'user':
        return `/profile/${result._id}`;
      case 'post':
        return `/post/${result._id}`;
      case 'group':
        return `/groups/${result._id}`;
    }
  };

  return (
    <Link
      href={getLink() || '#'}
      className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div>
          <h3 className="font-semibold text-white truncate">{getTitle()}</h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{getDescription()}</p>
        </div>
      </div>
    </Link>
  );
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const queryParam = resolvedSearchParams.q;
  const typeParam = resolvedSearchParams.type;

  // Handle string[] | string | undefined
  const query = Array.isArray(queryParam) ? queryParam[0] : queryParam ?? '';
  const type = Array.isArray(typeParam) ? typeParam[0] : typeParam ?? 'all';

  const results = await getSearchResults(query, type);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search bar / filter UI */}
      <SearchPageClient />

      {query && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Results for <span className="text-blue-500">&quot;{query}&quot;</span>
          </h2>
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((result) => (
                <ResultItem key={`${result.type}-${result._id}`} result={result} />
              ))
            ) : (
              <p className="text-center text-gray-500 pt-8">No results found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}