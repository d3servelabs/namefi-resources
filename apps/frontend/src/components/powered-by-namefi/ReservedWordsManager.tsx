'use client';
import { useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Badge } from '@/components/ui/shadcn/badge';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Trash2,
  Plus,
  Upload,
  FileText,
  Search,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { range } from 'ramda';

interface ReservedWordsManagerProps {
  domain: NamefiNormalizedDomain;
}

export function ReservedWordsManager({ domain }: ReservedWordsManagerProps) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWords, setNewWords] = useState('');
  const [wordsToRemove, setWordsToRemove] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'system'>(
    'all',
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [ignoreExistingWords, setIgnoreExistingWords] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Fetch reserved words
  const reservedWordsQuery = useQuery(
    trpc.pbnOwner.getReservedWords.queryOptions({
      normalizedDomainName: domain,
    }),
  );

  // Add words mutation
  const addWordsMutation = useMutation(
    trpc.pbnOwner.addReservedWords.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: trpc.pbnOwner.getReservedWords.queryKey(),
        });
        setIsAddDialogOpen(false);
        setNewWords('');
        setValidationErrors([]);
        setIgnoreExistingWords(false);
        toast.success('Reserved words added successfully');
      },
      onError: (error) => {
        toast.error(`Failed to add words: ${error.message}`);
      },
    }),
  );

  // Remove words mutation
  const removeWordsMutation = useMutation(
    trpc.pbnOwner.removeReservedWords.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: trpc.pbnOwner.getReservedWords.queryKey(),
        });
        setWordsToRemove([]);
        toast.success('Reserved words removed successfully');
      },
      onError: (error) => {
        toast.error(`Failed to remove words: ${error.message}`);
      },
    }),
  );

  const handleAddWords = () => {
    if (!newWords.trim()) return;

    // Parse words from input (split by commas, spaces, newlines, tabs)
    const words = newWords
      .split(/[,\s\n\t]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      toast.error('No valid words found');
      return;
    }

    // Client-side validation
    const errors: string[] = [];
    const validWords: string[] = [];

    words.forEach((word) => {
      const sanitizedWord = word.toLowerCase().trim();

      // Check if word is already in system reserved words
      if (safeFixedReservedWords.includes(sanitizedWord)) {
        if (!ignoreExistingWords) {
          errors.push(`"${word}" is already a system reserved word`);
        }
        return;
      }

      // Check if word is already in custom reserved words
      if (safeEditableReservedWords.includes(sanitizedWord)) {
        if (!ignoreExistingWords) {
          errors.push(`"${word}" is already in your custom reserved words`);
        }
        return;
      }

      // Check if word would conflict with existing domains
      const existingDomain = allWords.find(
        (item) => item.word === sanitizedWord && item.type === 'system',
      );
      if (existingDomain && !ignoreExistingWords) {
        errors.push(`"${word}" conflicts with an existing domain`);
        return;
      }

      // Basic validation
      if (sanitizedWord.length < 2) {
        errors.push(`"${word}" is too short (minimum 2 characters)`);
        return;
      }

      if (sanitizedWord.length > 50) {
        errors.push(`"${word}" is too long (maximum 50 characters)`);
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedWord)) {
        errors.push(
          `"${word}" contains invalid characters (only letters, numbers, hyphens, and underscores allowed)`,
        );
        return;
      }

      validWords.push(sanitizedWord);
    });

    setValidationErrors(errors);

    if (errors.length > 0 && !ignoreExistingWords) {
      return;
    }

    if (validWords.length === 0) {
      toast.error('No valid words to add after filtering');
      return;
    }

    addWordsMutation.mutate({
      normalizedDomainName: domain,
      words: validWords,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNewWords(content);
    };
    reader.readAsText(file);
  };

  const handleRemoveWords = () => {
    if (wordsToRemove.length === 0) return;

    removeWordsMutation.mutate({
      normalizedDomainName: domain,
      words: wordsToRemove,
    });
  };

  if (reservedWordsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reserved Words Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="space-y-2">
              {range(0, 5).map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-6 bg-gray-200 rounded w-20"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservedWordsQuery.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reserved Words Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            Error loading reserved words: {reservedWordsQuery.error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { fixedReservedWords, editableReservedWords } =
    reservedWordsQuery.data || {
      fixedReservedWords: [],
      editableReservedWords: [],
    };

  const safeEditableReservedWords = editableReservedWords || [];
  const safeFixedReservedWords = fixedReservedWords || [];

  // Combine all words with their types
  const allWords = [
    ...safeEditableReservedWords.map((word) => ({
      word,
      type: 'custom' as const,
    })),
    ...safeFixedReservedWords.map((word) => ({
      word,
      type: 'system' as const,
    })),
  ];

  // Filter and sort words
  const filteredAndSortedWords = allWords
    .filter((item) => {
      const matchesSearch = item.word
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const comparison = a.word.localeCompare(b.word);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reserved Words Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Words
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reserved Words</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="words-input">Words to Reserve</Label>
                  <Textarea
                    id="words-input"
                    placeholder="Enter words separated by commas, spaces, or newlines&#10;Example: admin, dashboard, api, support"
                    value={newWords}
                    onChange={(e) => setNewWords(e.target.value)}
                    rows={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Words will be automatically sanitized and validated
                  </p>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-3 bg-red-500/50 border border-red-200/50 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      Validation Errors:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={`error-${error}`}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ignore Existing Words Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ignore-existing"
                    checked={ignoreExistingWords}
                    onCheckedChange={(checked) =>
                      setIgnoreExistingWords(checked as boolean)
                    }
                  />
                  <Label htmlFor="ignore-existing" className="text-sm">
                    Ignore existing words and conflicts
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  When checked, words that already exist or conflict will be
                  filtered out instead of showing errors.
                </p>

                <div>
                  <Label htmlFor="file-upload">Or upload a text file</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    {newWords && (
                      <Badge variant="secondary">
                        <FileText className="w-3 h-3 mr-1" />
                        File loaded
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setNewWords('');
                      setValidationErrors([]);
                      setIgnoreExistingWords(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddWords}
                    disabled={addWordsMutation.isPending || !newWords.trim()}
                  >
                    {addWordsMutation.isPending ? 'Adding...' : 'Add Words'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* All Reserved Words */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold">Reserved Words</h3>
              <p className="text-sm text-gray-600">
                All words that cannot be registered as subdomains under your
                domain.
              </p>
            </div>
            {wordsToRemove.length > 0 && (
              <AlertDialog
                open={isRemoveDialogOpen}
                onOpenChange={setIsRemoveDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Selected ({wordsToRemove.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remove Custom Reserved Words
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {wordsToRemove.length}{' '}
                      custom reserved word(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setWordsToRemove([])}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveWords}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value: 'all' | 'custom' | 'system') =>
                setTypeFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>

          {filteredAndSortedWords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {allWords.length === 0
                  ? 'No reserved words yet.'
                  : 'No words match your search.'}
              </p>
              <p className="text-sm">
                {allWords.length === 0
                  ? 'Add custom words to prevent them from being registered as subdomains.'
                  : 'Try adjusting your search terms.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredAndSortedWords.length > 0 &&
                          wordsToRemove.length ===
                            filteredAndSortedWords.filter(
                              (item) => item.type === 'custom',
                            ).length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Add all custom filtered words to the removal list
                            const customWords = filteredAndSortedWords
                              .filter((item) => item.type === 'custom')
                              .map((item) => item.word);
                            const newWordsToRemove = [
                              ...new Set([...wordsToRemove, ...customWords]),
                            ];
                            setWordsToRemove(newWordsToRemove);
                          } else {
                            // Remove all custom filtered words from the removal list
                            const customWordsSet = new Set(
                              filteredAndSortedWords
                                .filter((item) => item.type === 'custom')
                                .map((item) => item.word),
                            );
                            setWordsToRemove(
                              wordsToRemove.filter(
                                (word) => !customWordsSet.has(word),
                              ),
                            );
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Word</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-24 hidden sm:table-cell">
                      Length
                    </TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedWords.map((item) => (
                    <TableRow key={`${item.type}-${item.word}`}>
                      <TableCell>
                        <Checkbox
                          checked={
                            item.type === 'custom' &&
                            wordsToRemove.includes(item.word)
                          }
                          disabled={item.type === 'system'}
                          onCheckedChange={(checked) => {
                            if (item.type === 'system') return; // Don't allow selecting system words
                            if (checked) {
                              setWordsToRemove([...wordsToRemove, item.word]);
                            } else {
                              setWordsToRemove(
                                wordsToRemove.filter((w) => w !== item.word),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.word}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={
                                  item.type === 'custom'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="cursor-help"
                              >
                                {item.type === 'custom' ? 'Custom' : 'System'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {item.type === 'custom'
                                  ? 'Custom reserved words are specific to your domain and can be added or removed by you.'
                                  : 'System reserved words are predefined by the platform and cannot be modified. They protect common terms and brand names.'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-gray-500 hidden sm:table-cell">
                        {item.word.length}
                      </TableCell>
                      <TableCell>
                        {item.type === 'custom' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setWordsToRemove([item.word]);
                              // Trigger the remove dialog
                              setTimeout(() => {
                                setIsRemoveDialogOpen(true);
                              }, 100);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredAndSortedWords.length > 0 && (
            <div className="text-sm text-gray-500 mt-2">
              Showing {filteredAndSortedWords.length} of {allWords.length} words
              {filteredAndSortedWords.some(
                (item) => item.type === 'custom',
              ) && (
                <span className="ml-2">
                  ({wordsToRemove.length} selected for removal)
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
