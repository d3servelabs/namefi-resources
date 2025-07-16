import { Badge } from '@/components/ui/shadcn/badge';

interface Tag {
  id: string;
}

interface TagsDisplayProps {
  tags: Tag[];
  limit?: number;
  className?: string;
}

export const TagsDisplay = ({
  tags,
  limit = Number.POSITIVE_INFINITY,
  className = '',
}: TagsDisplayProps) => {
  const displayTags = tags.slice(0, limit);
  const hasMoreTags = tags.length > limit;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {displayTags.map((tag) => (
        <Badge key={tag.id} variant="outline">
          {tag.id.replace(/_/g, ' ')}
        </Badge>
      ))}
      {hasMoreTags && <Badge variant="outline">...</Badge>}
    </div>
  );
};
