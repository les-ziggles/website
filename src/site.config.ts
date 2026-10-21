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
  address: {
    locality: 'Antibes',
    postalCode: '06600',
    region: 'Alpes-Maritimes',
    country: 'FR',
  },
  emails: {
    board: 'ziggles06@gmail.com',
    youthCoaches: 'coachs.jeunes@ziggles.fr',
  },
  social: {
    facebook: 'https://www.facebook.com/ziggles06/',
    x: 'https://twitter.com/ziggles06',
    xHandle: '@ziggles06',
  },
  attendanceUrl: 'https://ziggles.yaentrainement.fr/',
  medicalCertificateTemplateUrl: 'https://drive.google.com/file/d/1tmLvBe0vjNGHD9QcqwqrVqLmoJWBDOgi/view',
  licenceGuidePdfUrl: 'https://zigglessite.wordpress.com/wp-content/uploads/2024/08/demande-de-licence-mon-espace-licencie.pdf',
  introVideo: {
    youtubeId: '6MKa0auCino',
    year: 2004,
  },
} as const;
