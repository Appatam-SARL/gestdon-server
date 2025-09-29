export interface DomainActivity {
  domain: string;
  activities: string[];
}

export const DOMAIN_ACTIVITIES: DomainActivity[] = [
  {
    domain: 'sport',
    activities: [
      'Organisation de compétitions',
      'Clubs et associations sportives',
      'Entraînement & coaching',
      'Promotion du sport scolaire et universitaire',
      'Infrastructure sportive',
      'Sport pour tous / loisirs',
    ],
  },
  {
    domain: 'culture',
    activities: [
      'Arts (musique, danse, théâtre, cinéma, arts plastiques)',
      'Patrimoine (musées, monuments, traditions)',
      'Événements culturels & festivals',
      'Édition & littérature',
      'Promotion de la diversité culturelle',
    ],
  },
  {
    domain: 'sante',
    activities: [
      'Campagnes de sensibilisation',
      'Centres de santé et hôpitaux',
      'Pharmacie & accès aux médicaments',
      'Santé communautaire',
      'Santé maternelle et infantile',
      'Prévention et dépistage',
    ],
  },
  {
    domain: 'economie',
    activities: [
      'Entrepreneuriat & PME/TPE',
      'Commerce et distribution',
      'Microfinance & coopératives',
      'Agriculture et agroalimentaire',
      'Tourisme et hôtellerie',
      'Industrie & transformation',
    ],
  },
  {
    domain: 'environnement',
    activities: [
      'Reboisement & protection de la biodiversité',
      'Gestion des déchets',
      'Sensibilisation écologique',
      'Assainissement & hygiène publique',
      'Eau & assainissement',
      'Lutte contre le changement climatique',
    ],
  },
  {
    domain: 'education',
    activities: [
      'Construction & rénovation d’écoles',
      'Formation professionnelle & technique',
      'Alphabétisation',
      'Bourses et aides scolaires',
      'Activités parascolaires',
      'Innovation pédagogique & numérique éducatif',
    ],
  },
  {
    domain: 'logement',
    activities: [
      'Construction de logements sociaux',
      'Aide à la rénovation et réhabilitation',
      'Urbanisme & aménagement',
      'Accès à l’eau et l’électricité',
      'Habitat durable & écologique',
    ],
  },
  {
    domain: 'politique',
    activities: [
      'Sensibilisation citoyenne',
      'Promotion de la démocratie & gouvernance',
      'Droits humains & égalité',
      'Appui aux institutions locales',
      'Programmes électoraux et campagnes',
    ],
  },
  {
    domain: 'communication',
    activities: [
      'Médias (presse, radio, TV)',
      'Communication institutionnelle',
      'Publicité & marketing',
      'Sensibilisation & campagnes sociales',
      'Communication digitale & réseaux sociaux',
    ],
  },
  {
    domain: "technologie de l'information",
    activities: [
      'Développement d’applications & logiciels',
      'Cybersécurité',
      'Formation au numérique',
      'Inclusion digitale',
      'Équipement & infrastructures IT',
      'Innovation technologique',
    ],
  },
  {
    domain: 'batiment et btp',
    activities: [
      'Routes & infrastructures',
      'Construction de bâtiments publics',
      'Ouvrages hydrauliques',
      'Travaux d’électricité & plomberie',
      'Génie civil & urbanisme',
    ],
  },
  {
    domain: 'evenementielle',
    activities: [
      'Organisation de conférences & séminaires',
      'Festivals & concerts',
      'Foires & salons professionnels',
      'Événements sportifs',
      'Mariages & cérémonies',
      'Gestion logistique et technique d’événements',
    ],
  },
  {
    domain: 'autre',
    activities: [
      'Actions humanitaires',
      'Sécurité & protection civile',
      'Transport & mobilité',
      'Innovation sociale',
      'Coopération internationale',
    ],
  },
];
