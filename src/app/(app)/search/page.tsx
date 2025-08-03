import Link from 'next/link';
import { UserIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/solid';

interface SearchResult {
  _id: string;
  name?: string;        // For users and groups
  content?: string;     // For posts
  description?: string; // For groups
  type: 'user' | 'post' | 'group';
}

// Updated: searchParams is Promise now
interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getSearchResults(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/search?q=${encodeURIComponent(query)}`,
      {
        cache: 'no-store', // Don't cache search results
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch search results", error);
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
      default:
        return null;
    }
  };

  const getTitle = () => result.name || result.content || 'Result';
  const getDescription = () => result.description || result.content;
  const getLink = () => {
    switch (result.type) {
      case 'user':
        return `/profile/${result._id}`;
      case 'post':
        return `/post/${result._id}`;
      case 'group':
        return `/groups/${result._id}`;
      default:
        return '#';
    }
  };

  return (
    <Link
      href={getLink()}
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
  const params = await searchParams; // await the Promise here
  const query = typeof params.q === 'string' ? params.q : '';

  const results = await getSearchResults(query);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">
        Search Results for <span className="text-blue-500">&quot;{query}&quot;</span>
      </h1>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map(result => (
            <ResultItem key={`${result.type}-${result._id}`} result={result} />
          ))
        ) : (
          <p className="text-center text-gray-500 pt-8">No results found.</p>
        )}
      </div>
    </div>
  );
}
