// Club-wide facts used across pages, structured data and metadata.
// Update here first: nothing below is duplicated elsewhere in the code.

export const SITE = {
  url: 'https://ziggles.fr',
  name: 'Les Ziggles',
  legalName: 'Les Ziggles – Ultimate & Disc Golf Club Antibes',
  foundingYear: 2003,
  /** Browser UI and app icon background: the badge navy. */
  themeColor: '#040c36',
  federation: {
    name: 'Fédération Française de Flying Disc',
    shortName: 'FFFD',
    url: 'https://www.ff-flyingdisc.fr/',
    memberSpaceUrl: 'https://monespace.ff-flyingdisc.fr/',
    clubCode: '006001',
  },
  /** The association behind the club (legal notice). */
  association: {
    name: 'LES ZIGGLES',
    rna: 'W061003545',
  },
  /** Registered office of the association. */
  address: {
    street: '165 Rue des Cistes',
    extended: 'chez Craftazur, Bât B, Pôle Entreprise Euro 95',
    locality: 'Antibes',
    postalCode: '06600',
    region: 'Alpes-Maritimes',
    country: 'FR',
  },
  /** The club's contact address, used everywhere on the site. */
  email: 'contact@ziggles.fr',
  social: {
    facebook: 'https://www.facebook.com/ziggles06/',
    instagram: 'https://www.instagram.com/ziggles06/',
    instagramHandle: '@ziggles06',
  },
  attendanceUrl: 'https://ziggles.yaentrainement.fr/',
  medicalCertificateTemplateUrl: 'https://drive.google.com/file/d/1tmLvBe0vjNGHD9QcqwqrVqLmoJWBDOgi/view',
  licenceGuidePdfUrl: 'https://zigglessite.wordpress.com/wp-content/uploads/2024/08/demande-de-licence-mon-espace-licencie.pdf',
  introVideo: {
    youtubeId: '6MKa0auCino',
    year: 2004,
  },
} as const;
