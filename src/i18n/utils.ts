import { ui, defaultLang } from './ui';
import { routes } from './routes';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) {
    return lang as keyof typeof ui;
  }
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: string) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function useLocalizedPath(lang: keyof typeof ui) {
  return function localizedPath(path: string) {
    const pathSegments = path.split('/').filter(Boolean); // Remove empty strings from split
    const route = pathSegments[0]; // Assuming the first segment is the route name

    if (lang === defaultLang) {
      return path; // No prefix for default language
    }

    if (route && routes[route] && routes[route][lang]) {
      return `/${lang}${routes[route][lang]}`;
    }

    return `/${lang}${path}`;
  };
}
