import { Search, BookOpen, FileText } from 'lucide-react';
import { useKnowledge, useKnowledgeSearch } from '@/hooks/useKnowledge';
import { UploadZone } from '@/components/knowledge/UploadZone';
import { DocumentCard } from '@/components/knowledge/DocumentCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function KnowledgePage() {
  const {
    documents,
    isLoading,
    uploadDocument,
    isUploading,
    uploadError,
    deleteDocument,
  } = useKnowledge();

  const { query, setQuery, results, isSearching } = useKnowledgeSearch();

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5" />
            Knowledge Base
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload documents to enhance your AI assistant with domain-specific knowledge.
          </p>
        </div>

        <UploadZone
          onUpload={uploadDocument}
          isUploading={isUploading}
          error={uploadError}
        />

        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search knowledge base (min 3 characters)..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-sm
                text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              "
              aria-label="Search documents"
            />
          </div>

          {query.length >= 3 && (
            <div className="mb-6">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Search Results ({results.length})
                  </h3>
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {result.documentName}
                        </span>
                        <span className="text-xs text-slate-400">
                          Score: {(result.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3">
                        {result.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  No results found for "{query}"
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Documents ({documents.length})
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No documents uploaded yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Upload your first document above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={deleteDocument}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
