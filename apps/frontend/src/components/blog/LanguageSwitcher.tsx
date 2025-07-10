import Link from 'next/link';

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: string[];
  slug: string;
}

export function LanguageSwitcher({
  currentLanguage,
  availableLanguages,
  slug,
}: LanguageSwitcherProps) {
  return (
    <div className="flex gap-2 mb-8">
      {availableLanguages.map((lang) => (
        <Link
          key={lang}
          href={`/${lang}/blog/${slug}`}
          className={`px-3 py-1 rounded ${
            lang === currentLanguage
              ? 'bg-blue-500 text-secondary-foreground'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {lang.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
