import { getRelativeLocaleUrl } from 'astro:i18n';
import { defaultLocale, type Locale } from './config';
import { translatedRoutes } from './routes';
import { ui as uiAgileDevOps } from './pages/agile-devops';
import { ui as uiPubblicaAmministrazione } from './pages/pubblica-amministrazione';
import { ui as uiFactory } from './pages/factory';
import { ui as uiSviluppoProgetto } from './pages/sviluppo-progetto';

/** Strip /en prefix to get the locale-neutral path. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/en/') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'it';
}

/** Build an internal path for the given locale. */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) {
    return getRelativeLocaleUrl(defaultLocale, normalized === '/' ? '' : normalized.slice(1));
  }
  return getRelativeLocaleUrl(locale, normalized === '/' ? '' : normalized.slice(1));
}

/**
 * URL for switching language on the current page.
 * Falls back to locale homepage if the target translation is not published yet.
 */
export function getAlternateLocaleUrl(currentPathname: string, targetLocale: Locale): string {
  const neutralPath = stripLocalePrefix(currentPathname);

  if (!translatedRoutes.has(neutralPath)) {
    return localizedPath('/', targetLocale);
  }

  return localizedPath(neutralPath, targetLocale);
}

export function getAlternateLocales(currentLocale: Locale): Locale[] {
  return currentLocale === 'it' ? ['en'] : ['it'];
}

export function getAgileDevOpsContent(locale: Locale) {
  return {
    meta: {
      title: uiAgileDevOps[locale]['agileDevOps.title'],
      description: uiAgileDevOps[locale]['agileDevOps.description'],
    },
    hero: {
      title: uiAgileDevOps[locale]['agileDevOps.heroTitle'],
      subtitle: uiAgileDevOps[locale]['agileDevOps.heroSubtitle'],
    },
    breadcrumb: uiAgileDevOps[locale]['agileDevOps.breadcrumbs.agileDevOps'],
    problems: {
      title: uiAgileDevOps[locale]['agileDevOps.problems.title'],
      manualDeployTitle: uiAgileDevOps[locale]['agileDevOps.problems.manualDeployTitle'],
      manualDeployDescription: uiAgileDevOps[locale]['agileDevOps.problems.manualDeployDescription'],
      scrumNoResultsTitle: uiAgileDevOps[locale]['agileDevOps.problems.scrumNoResultsTitle'],
      scrumNoResultsDescription: uiAgileDevOps[locale]['agileDevOps.problems.scrumNoResultsDescription'],
      customerReportsTitle: uiAgileDevOps[locale]['agileDevOps.problems.customerReportsTitle'],
      customerReportsDescription: uiAgileDevOps[locale]['agileDevOps.problems.customerReportsDescription'],
      longOnboardingTitle: uiAgileDevOps[locale]['agileDevOps.problems.longOnboardingTitle'],
      longOnboardingDescription: uiAgileDevOps[locale]['agileDevOps.problems.longOnboardingDescription'],
    },
    features: {
      title: uiAgileDevOps[locale]['agileDevOps.features.title'],
      items: [
        { title: uiAgileDevOps[locale]['agileDevOps.features.ciCdPipeline.title'], description: uiAgileDevOps[locale]['agileDevOps.features.ciCdPipeline.description'], icon: '🔄' },
        { title: uiAgileDevOps[locale]['agileDevOps.features.teamTopology.title'], description: uiAgileDevOps[locale]['agileDevOps.features.teamTopology.description'], icon: '👥' },
        { title: uiAgileDevOps[locale]['agileDevOps.features.agilePragmatico.title'], description: uiAgileDevOps[locale]['agileDevOps.features.agilePragmatico.description'], icon: '🎯' },
        { title: uiAgileDevOps[locale]['agileDevOps.features.iac.title'], description: uiAgileDevOps[locale]['agileDevOps.features.iac.description'], icon: '🏗️' },
        { title: uiAgileDevOps[locale]['agileDevOps.features.monitoring.title'], description: uiAgileDevOps[locale]['agileDevOps.features.monitoring.description'], icon: '📊' },
        { title: uiAgileDevOps[locale]['agileDevOps.features.devExperience.title'], description: uiAgileDevOps[locale]['agileDevOps.features.devExperience.description'], icon: '⚡' },
      ],
    },
    pricing: {
      title: uiAgileDevOps[locale]['agileDevOps.pricing.title'],
      subtitle: uiAgileDevOps[locale]['agileDevOps.pricing.subtitle'],
      plans: [
        {
          name: uiAgileDevOps[locale]['agileDevOps.pricing.assessment.name'],
          price: uiAgileDevOps[locale]['agileDevOps.pricing.assessment.price'],
          description: uiAgileDevOps[locale]['agileDevOps.pricing.assessment.description'],
          features: [
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.0'],
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.1'],
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.2'],
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.3'],
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.4'],
            uiAgileDevOps[locale]['agileDevOps.pricing.assessment.features.5'],
          ],
          cta: uiAgileDevOps[locale]['agileDevOps.pricing.assessment.cta'],
          highlighted: false,
        },
        {
          name: uiAgileDevOps[locale]['agileDevOps.pricing.implementation.name'],
          price: uiAgileDevOps[locale]['agileDevOps.pricing.implementation.price'],
          description: uiAgileDevOps[locale]['agileDevOps.pricing.implementation.description'],
          features: [
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.0'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.1'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.2'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.3'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.4'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.5'],
            uiAgileDevOps[locale]['agileDevOps.pricing.implementation.features.6'],
          ],
          cta: uiAgileDevOps[locale]['agileDevOps.pricing.implementation.cta'],
          highlighted: true,
        },
      ],
    },
    pdfGuidePath: '/risorse/guida-agile-devops',
    pdf: {
      title: uiAgileDevOps[locale]['agileDevOps.pdf.title'],
      description: uiAgileDevOps[locale]['agileDevOps.pdf.description'],
      cta: uiAgileDevOps[locale]['agileDevOps.pdf.cta'],
    },
  };
}

export function getPubblicaAmministrazioneContent(locale: Locale) {
  return {
    meta: {
      title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.title'],
      description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.description'],
    },
    hero: {
      title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.heroTitle'],
      subtitle: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.heroSubtitle'],
    },
    breadcrumb: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.breadcrumbs.pa'],
    context: {
      title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.title'],
      description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.description'],
      card1: {
        title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card1.title'],
        description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card1.description'],
      },
      card2: {
        title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card2.title'],
        description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card2.description'],
      },
      card3: {
        title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card3.title'],
        description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.context.card3.description'],
      },
    },
    features: {
      title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.title'],
      items: [
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.pnrrFondi.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.pnrrFondi.description'], icon: '🇪🇺' },
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.interoperabilita.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.interoperabilita.description'], icon: '🔗' },
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.cloudPa.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.cloudPa.description'], icon: '☁️' },
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.securityPrivacy.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.securityPrivacy.description'], icon: '🔒' },
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.serviziDigitali.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.serviziDigitali.description'], icon: '📱' },
        { title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.formazionePa.title'], description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.features.formazionePa.description'], icon: '🎓' },
      ],
    },
    pricing: {
      title: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.title'],
      subtitle: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.subtitle'],
      plans: [
        {
          name: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.name'],
          price: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.price'],
          description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.description'],
          features: [
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.0'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.1'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.2'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.3'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.4'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.features.5'],
          ],
          cta: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.technicalConsulting.cta'],
          highlighted: false,
        },
        {
          name: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.name'],
          price: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.price'],
          description: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.description'],
          features: [
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.0'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.1'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.2'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.3'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.4'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.5'],
            uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.features.6'],
          ],
          cta: uiPubblicaAmministrazione[locale]['pubblicaAmministrazione.pricing.pnrrProject.cta'],
          highlighted: true,
        },
      ],
    },
  };
}

export function getFactoryContent(locale: Locale) {
  return {
    meta: {
      title: uiFactory[locale]['factory.title'],
      description: uiFactory[locale]['factory.description'],
    },
    hero: {
      title: uiFactory[locale]['factory.heroTitle'],
      subtitle: uiFactory[locale]['factory.heroSubtitle'],
    },
    breadcrumb: uiFactory[locale]['factory.breadcrumbs.factory'],
    problem: {
      title: uiFactory[locale]['factory.problem.title'],
      description: uiFactory[locale]['factory.problem.description'],
      card1: {
        emoji: uiFactory[locale]['factory.problem.card1.emoji'],
        title: uiFactory[locale]['factory.problem.card1.title'],
        description: uiFactory[locale]['factory.problem.card1.description'],
      },
      card2: {
        emoji: uiFactory[locale]['factory.problem.card2.emoji'],
        title: uiFactory[locale]['factory.problem.card2.title'],
        description: uiFactory[locale]['factory.problem.card2.description'],
      },
      card3: {
        emoji: uiFactory[locale]['factory.problem.card3.emoji'],
        title: uiFactory[locale]['factory.problem.card3.title'],
        description: uiFactory[locale]['factory.problem.card3.description'],
      },
    },
    solution: {
      title: uiFactory[locale]['factory.solution.title'],
      description: uiFactory[locale]['factory.solution.description'],
    },
    features: {
      title: uiFactory[locale]['factory.features.title'],
      items: [
        { title: uiFactory[locale]['factory.features.dedicatedTeam.title'], description: uiFactory[locale]['factory.features.dedicatedTeam.description'], icon: '👥' },
        { title: uiFactory[locale]['factory.features.operationalContinuity.title'], description: uiFactory[locale]['factory.features.operationalContinuity.description'], icon: '🔁' },
        { title: uiFactory[locale]['factory.features.flexibleScaling.title'], description: uiFactory[locale]['factory.features.flexibleScaling.description'], icon: '📈' },
        { title: uiFactory[locale]['factory.features.knowledgeRetention.title'], description: uiFactory[locale]['factory.features.knowledgeRetention.description'], icon: '🧠' },
        { title: uiFactory[locale]['factory.features.guaranteedQuality.title'], description: uiFactory[locale]['factory.features.guaranteedQuality.description'], icon: '✅' },
        { title: uiFactory[locale]['factory.features.mobileDevelopment.title'], description: uiFactory[locale]['factory.features.mobileDevelopment.description'], icon: '📱' },
      ],
    },
    pricing: {
      title: uiFactory[locale]['factory.pricing.title'],
      subtitle: uiFactory[locale]['factory.pricing.subtitle'],
      plans: [
        {
          name: uiFactory[locale]['factory.pricing.base.name'],
          price: uiFactory[locale]['factory.pricing.base.price'],
          description: uiFactory[locale]['factory.pricing.base.description'],
          features: [
            uiFactory[locale]['factory.pricing.base.features.0'],
            uiFactory[locale]['factory.pricing.base.features.1'],
            uiFactory[locale]['factory.pricing.base.features.2'],
            uiFactory[locale]['factory.pricing.base.features.3'],
            uiFactory[locale]['factory.pricing.base.features.4'],
          ],
          cta: uiFactory[locale]['factory.pricing.base.cta'],
          highlighted: false,
        },
        {
          name: uiFactory[locale]['factory.pricing.standard.name'],
          price: uiFactory[locale]['factory.pricing.standard.price'],
          description: uiFactory[locale]['factory.pricing.standard.description'],
          features: [
            uiFactory[locale]['factory.pricing.standard.features.0'],
            uiFactory[locale]['factory.pricing.standard.features.1'],
            uiFactory[locale]['factory.pricing.standard.features.2'],
            uiFactory[locale]['factory.pricing.standard.features.3'],
            uiFactory[locale]['factory.pricing.standard.features.4'],
            uiFactory[locale]['factory.pricing.standard.features.5'],
            uiFactory[locale]['factory.pricing.standard.features.6'],
          ],
          cta: uiFactory[locale]['factory.pricing.standard.cta'],
          highlighted: true,
        },
        {
          name: uiFactory[locale]['factory.pricing.enterprise.name'],
          price: uiFactory[locale]['factory.pricing.enterprise.price'],
          description: uiFactory[locale]['factory.pricing.enterprise.description'],
          features: [
            uiFactory[locale]['factory.pricing.enterprise.features.0'],
            uiFactory[locale]['factory.pricing.enterprise.features.1'],
            uiFactory[locale]['factory.pricing.enterprise.features.2'],
            uiFactory[locale]['factory.pricing.enterprise.features.3'],
            uiFactory[locale]['factory.pricing.enterprise.features.4'],
            uiFactory[locale]['factory.pricing.enterprise.features.5'],
            uiFactory[locale]['factory.pricing.enterprise.features.6'],
          ],
          cta: uiFactory[locale]['factory.pricing.enterprise.cta'],
          highlighted: false,
        },
      ],
    },
    pdfGuidePath: '/risorse/guida-factory',
    pdf: {
      title: uiFactory[locale]['factory.pdf.title'],
      description: uiFactory[locale]['factory.pdf.description'],
      cta: uiFactory[locale]['factory.pdf.cta'],
    },
  };
}

export function getSviluppoProgettoContent(locale: Locale) {
  return {
    meta: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.title'],
      description: uiSviluppoProgetto[locale]['sviluppoProgetto.description'],
    },
    hero: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.heroTitle'],
      subtitle: uiSviluppoProgetto[locale]['sviluppoProgetto.heroSubtitle'],
    },
    breadcrumb: uiSviluppoProgetto[locale]['sviluppoProgetto.breadcrumbs.sviluppoProgetto'],
    problem: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.title'],
      description: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.description'],
      card1: {
        title: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card1.title'],
        description: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card1.description'],
      },
      card2: {
        title: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card2.title'],
        description: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card2.description'],
      },
      card3: {
        title: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card3.title'],
        description: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card3.description'],
      },
      card4: {
        title: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card4.title'],
        description: uiSviluppoProgetto[locale]['sviluppoProgetto.problem.card4.description'],
      },
    },
    solution: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.solution.title'],
      description: uiSviluppoProgetto[locale]['sviluppoProgetto.solution.description'],
    },
    features: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.title'],
      items: [
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.discoverySprint.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.discoverySprint.description'], icon: '🔍' },
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.solidArchitecture.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.solidArchitecture.description'], icon: '🏛️' },
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.iterativeDevelopment.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.iterativeDevelopment.description'], icon: '🔄' },
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.rigorousTesting.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.rigorousTesting.description'], icon: '✅' },
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.deployTraining.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.deployTraining.description'], icon: '🚀' },
        { title: uiSviluppoProgetto[locale]['sviluppoProgetto.features.postDeliveryWarranty.title'], description: uiSviluppoProgetto[locale]['sviluppoProgetto.features.postDeliveryWarranty.description'], icon: '🛡️' },
      ],
    },
    pricing: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.title'],
      subtitle: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.subtitle'],
      plans: [
        {
          name: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.name'],
          price: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.price'],
          description: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.description'],
          features: [
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.0'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.1'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.2'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.3'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.4'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.features.5'],
          ],
          cta: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectS.cta'],
          highlighted: false,
        },
        {
          name: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.name'],
          price: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.price'],
          description: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.description'],
          features: [
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.0'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.1'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.2'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.3'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.4'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.5'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.features.6'],
          ],
          cta: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectM.cta'],
          highlighted: true,
        },
        {
          name: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.name'],
          price: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.price'],
          description: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.description'],
          features: [
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.0'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.1'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.2'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.3'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.4'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.5'],
            uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.features.6'],
          ],
          cta: uiSviluppoProgetto[locale]['sviluppoProgetto.pricing.projectL.cta'],
          highlighted: false,
        },
      ],
    },
    pdfGuidePath: '/risorse/guida-sviluppo-progetto',
    pdf: {
      title: uiSviluppoProgetto[locale]['sviluppoProgetto.pdf.title'],
      description: uiSviluppoProgetto[locale]['sviluppoProgetto.pdf.description'],
      cta: uiSviluppoProgetto[locale]['sviluppoProgetto.pdf.cta'],
    },
  };
}
