export type BaseEmailTemplateProps = {
  title: string;
  content: string;
  useContainer: boolean;
  useHeader?: boolean;
  useFooter?: boolean;
  showGoToDashboard?: boolean;
};

export const extractOriginalContentComment = (htmlTemplate: string) => {
  const comment = htmlTemplate.match(
    /<!-- ORIGINAL_CONTENT\[\[(.*?)\]\] -->/,
  )?.[1];
  if (!comment) {
    throw new Error('No markdown comment found');
  }
  return parseOriginalContentComment(comment);
};

export const createOriginalContentComment = (props: BaseEmailTemplateProps) => {
  return `<!-- ORIGINAL_CONTENT[[${Buffer.from(JSON.stringify(props)).toString('base64url')}]] -->`;
};

export const parseOriginalContentComment = (
  comment: string,
): BaseEmailTemplateProps => {
  const decoded = Buffer.from(
    comment.replace('<!-- ORIGINAL_CONTENT[[', '').replace(']] -->', ''),
    'base64url',
  ).toString('utf-8');
  const parsed: unknown = JSON.parse(decoded);
  if (!isBaseEmailTemplateProps(parsed)) {
    throw new Error(
      'Invalid ORIGINAL_CONTENT payload: required fields missing or wrong type',
    );
  }
  return parsed;
};

const isBaseEmailTemplateProps = (
  value: unknown,
): value is BaseEmailTemplateProps => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.title !== 'string') return false;
  if (typeof candidate.content !== 'string') return false;
  if (typeof candidate.useContainer !== 'boolean') return false;
  // The remaining fields are optional in the type — only enforce shape when present.
  for (const key of ['useHeader', 'useFooter', 'showGoToDashboard'] as const) {
    if (candidate[key] !== undefined && typeof candidate[key] !== 'boolean') {
      return false;
    }
  }
  return true;
};
