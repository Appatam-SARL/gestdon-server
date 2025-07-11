export interface IAction {
  name: string;
  value: string;
  enabled: boolean;
}

export interface IPermissionConstant {
  menu: string;
  label: string;
  actions: IAction[];
}

const PERMISSIONS: IPermissionConstant[] = [
  {
    menu: 'staff',
    label: 'Gestion des membres',
    actions: [
      { name: 'Créer un nouveau membre', value: 'create', enabled: true },
      {
        name: 'Créer un nouveau membre par invitation',
        value: 'create_by_invitation',
        enabled: true,
      },
      { name: 'Filtre la liste des membres', value: 'filter', enabled: true },
      { name: 'Lire la liste des membres', value: 'read', enabled: true },
      {
        name: 'Voir les détails du membre',
        value: 'read_detail',
        enabled: true,
      },
      { name: 'Modifier un membre', value: 'update', enabled: true },
      { name: 'Modifier le rôle', value: 'update_role', enabled: true },
      { name: 'Supprimer un membre', value: 'delete', enabled: true },
      {
        name: "Voir la liste des permissions d'un membre",
        value: 'list_permissions',
        enabled: true,
      },
      {
        name: "Modififer les permissions d'un membre",
        value: 'update_permissions',
        enabled: true,
      },
    ],
  },
  {
    menu: 'Activités',
    label: 'Gestion des activités',
    actions: [
      { name: 'Créer une nouvelle activité', value: 'create', enabled: false },
      { name: 'Lire la liste des activités', value: 'read', enabled: false },
      { name: 'Modifier une activité', value: 'update', enabled: false },
      { name: 'Valider une activité', value: 'validate', enabled: false },
      { name: 'Refuser une activité', value: 'refuse', enabled: false },
      { name: 'Archiver une activité', value: 'archive', enabled: false },
      {
        name: 'Mettre une activité en brouillon',
        value: 'draft',
        enabled: false,
      },
      { name: 'Supprimer une activité', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'Rapports',
    label: 'Gestion des rapports',
    actions: [
      { name: 'Créer un nouveau rapport', value: 'create', enabled: false },
      { name: 'Lire la liste des rapports', value: 'read', enabled: false },
      { name: 'Modifier un rapport', value: 'update', enabled: true },
      {
        name: 'Voir les détails du rapport',
        value: 'read_detail',
        enabled: false,
      },
      { name: 'Valider un rapport', value: 'validate', enabled: false },
      { name: 'Refuser un rapport', value: 'refuse', enabled: false },
      { name: 'Archiver un rapport', value: 'archive', enabled: false },
      {
        name: 'Mettre un rapport en brouillon',
        value: 'draft',
        enabled: false,
      },
      { name: 'Rejeter un rapport', value: 'reject', enabled: false },
      { name: 'Modifier un rapport', value: 'update', enabled: false },
      { name: 'Supprimer un rapport', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'Bénéficiaires',
    label: 'Gestion des bénéficiaires',
    actions: [
      {
        name: 'Créer un nouveau bénéficiaire',
        value: 'create',
        enabled: false,
      },
      {
        name: 'Lire la liste des bénéficiaires',
        value: 'read',
        enabled: false,
      },
      { name: 'Modifier un bénéficiaire', value: 'update', enabled: false },
      { name: 'Supprimer un bénéficiaire', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'Paramètres',
    label: 'Gestion des paramètres',
    actions: [
      { name: 'Créer un nouveau paramètre', value: 'create', enabled: false },
      { name: 'Lire la liste des paramètres', value: 'read', enabled: false },
      { name: 'Modifier un paramètre', value: 'update', enabled: false },
      { name: 'Supprimer un paramètre', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'don',
    label: 'Gestion des Dons',
    actions: [
      { name: 'Créer un nouveau don', value: 'create', enabled: false },
      { name: 'Lire la liste des dons', value: 'read', enabled: false },
      { name: 'Voir les détails du don', value: 'read_detail', enabled: false },
      {
        name: 'Voir les statistiques du don',
        value: 'read_stats',
        enabled: false,
      },
      { name: 'Modifier un don', value: 'update', enabled: false },
      { name: 'Valider un don', value: 'validate', enabled: false },
      { name: 'Refuser un don', value: 'refuse', enabled: false },
      { name: 'Archiver un don', value: 'archive', enabled: false },
      {
        name: 'Mettre un don en brouillon',
        value: 'draft',
        enabled: false,
      },
      { name: 'Supprimer un don', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'promesse',
    label: 'Gestion des Promesses',
    actions: [
      { name: 'Créer une nouvelle promesse', value: 'create', enabled: false },
      { name: 'Lire la liste des promesses', value: 'read', enabled: false },
      { name: 'Modifier une promesse', value: 'update', enabled: false },
      { name: 'Valider une promesse', value: 'validate', enabled: false },
      { name: 'Refuser une promesse', value: 'refuse', enabled: false },
      { name: 'Archiver une promesse', value: 'archive', enabled: false },
      {
        name: 'Mettre une promesse en brouillon',
        value: 'draft',
        enabled: false,
      },
      { name: 'Supprimer une promesse', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'Audience',
    label: 'Gestion des audiences',
    actions: [
      { name: 'Créer une nouvelle audience', value: 'create', enabled: false },
      { name: 'Lire la liste des audiences', value: 'read', enabled: false },
      { name: 'Modifier une audience', value: 'update', enabled: false },
      { name: 'Valider une audience', value: 'validate', enabled: false },
      { name: 'Refuser une audience', value: 'refuse', enabled: false },
      { name: 'Archiver une audience', value: 'archive', enabled: false },
      {
        name: 'Mettre une audience en brouillon',
        value: 'draft',
        enabled: false,
      },
      {
        name: 'Assigner un membre à une audience',
        value: 'assign',
        enabled: false,
      },
      { name: 'Supprimer une audience', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'log',
    label: "Gestion des historiques d'actions",
    actions: [
      { name: 'Créer un nouveau log', value: 'create', enabled: true },
      { name: 'Lire la liste des logs', value: 'read', enabled: true },
      { name: 'Modifier un log', value: 'update', enabled: true },
      { name: 'Supprimer un log', value: 'delete', enabled: true },
      { name: 'Exporter les logs', value: 'export', enabled: true },
      { name: 'Importer des logs', value: 'import', enabled: true },
    ],
  },
  {
    menu: 'dashboard',
    label: 'Tableau de bord',
    actions: [
      {
        name: 'Voir les statistiques du tableau de bord',
        value: 'read_stats',
        enabled: true,
      },
      {
        name: 'Filtrer les statistiques du tableau de bord',
        value: 'filter',
        enabled: true,
      },
      {
        name: 'Voir les 6 derniers bénéficiaires',
        value: 'read_beneficiaries',
        enabled: true,
      },
      {
        name: 'Vooir le graphiques des activités',
        value: 'read_activity_graph',
        enabled: true,
      },
      {
        name: 'Voir le tableau des 15 derniers rapports',
        value: 'read_reports',
        enabled: true,
      },
    ],
  },
];

const PERMISSIONSOWNER: IPermissionConstant[] = [
  {
    menu: 'staff',
    label: 'Gestion des membres',
    actions: [
      { name: 'Créer un nouveau membre', value: 'create', enabled: true },
      {
        name: 'Créer un nouveau membre par invitation',
        value: 'create_by_invitation',
        enabled: true,
      },
      { name: 'Filtre la liste des membres', value: 'filter', enabled: true },
      { name: 'Lire la liste des membres', value: 'read', enabled: true },
      {
        name: 'Voir les détails du membre',
        value: 'read_detail',
        enabled: true,
      },
      { name: 'Modifier un membre', value: 'update', enabled: true },
      { name: 'Modifier le rôle', value: 'update_role', enabled: true },
      { name: 'Supprimer un membre', value: 'delete', enabled: true },
      {
        name: "Voir la liste des permissions d'un membre",
        value: 'list_permissions',
        enabled: true,
      },
      {
        name: "Modififer les permissions d'un membre",
        value: 'update_permissions',
        enabled: true,
      },
    ],
  },
  {
    menu: 'Activités',
    label: 'Gestion des activités',
    actions: [
      { name: 'Créer une nouvelle activité', value: 'create', enabled: true },
      { name: 'Lire la liste des activités', value: 'read', enabled: true },
      { name: 'Modifier une activité', value: 'update', enabled: true },
      { name: 'Valider une activité', value: 'validate', enabled: true },
      { name: 'Refuser une activité', value: 'refuse', enabled: true },
      { name: 'Archiver une activité', value: 'archive', enabled: true },
      {
        name: 'Mettre une activité en brouillon',
        value: 'draft',
        enabled: true,
      },
      { name: 'Supprimer une activité', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'Rapports',
    label: 'Gestion des rapports',
    actions: [
      { name: 'Créer un nouveau rapport', value: 'create', enabled: true },
      { name: 'Lire la liste des rapports', value: 'read', enabled: true },
      { name: 'Modifier un rapport', value: 'update', enabled: true },
      {
        name: 'Voir les détails du rapport',
        value: 'read_detail',
        enabled: true,
      },
      { name: 'Valider un rapport', value: 'validate', enabled: true },
      { name: 'Refuser un rapport', value: 'refuse', enabled: true },
      { name: 'Archiver un rapport', value: 'archive', enabled: true },
      {
        name: 'Mettre un rapport en brouillon',
        value: 'draft',
        enabled: true,
      },
      { name: 'Rejeter un rapport', value: 'reject', enabled: true },
      { name: 'Modifier un rapport', value: 'update', enabled: true },
      { name: 'Supprimer un rapport', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'Bénéficiaires',
    label: 'Gestion des bénéficiaires',
    actions: [
      {
        name: 'Créer un nouveau bénéficiaire',
        value: 'create',
        enabled: true,
      },
      {
        name: 'Lire la liste des bénéficiaires',
        value: 'read',
        enabled: true,
      },
      { name: 'Modifier un bénéficiaire', value: 'update', enabled: true },
      { name: 'Supprimer un bénéficiaire', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'Paramètres',
    label: 'Gestion des paramètres',
    actions: [
      { name: 'Créer un nouveau paramètre', value: 'create', enabled: true },
      { name: 'Lire la liste des paramètres', value: 'read', enabled: true },
      { name: 'Modifier un paramètre', value: 'update', enabled: true },
      { name: 'Supprimer un paramètre', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'don',
    label: 'Gestion des Dons',
    actions: [
      { name: 'Créer un nouveau don', value: 'create', enabled: true },
      { name: 'Lire la liste des dons', value: 'read', enabled: true },
      { name: 'Voir les détails du don', value: 'read_detail', enabled: true },
      {
        name: 'Voir les statistiques du don',
        value: 'read_stats',
        enabled: true,
      },
      { name: 'Modifier un don', value: 'update', enabled: true },
      { name: 'Valider un don', value: 'validate', enabled: true },
      { name: 'Refuser un don', value: 'refuse', enabled: true },
      { name: 'Archiver un don', value: 'archive', enabled: true },
      {
        name: 'Mettre un don en brouillon',
        value: 'draft',
        enabled: true,
      },
      { name: 'Supprimer un don', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'promesse',
    label: 'Gestion des Promesses',
    actions: [
      { name: 'Créer une nouvelle promesse', value: 'create', enabled: true },
      { name: 'Lire la liste des promesses', value: 'read', enabled: true },
      { name: 'Modifier une promesse', value: 'update', enabled: true },
      { name: 'Valider une promesse', value: 'validate', enabled: true },
      { name: 'Refuser une promesse', value: 'refuse', enabled: true },
      { name: 'Archiver une promesse', value: 'archive', enabled: true },
      {
        name: 'Mettre une promesse en brouillon',
        value: 'draft',
        enabled: true,
      },
      { name: 'Supprimer une promesse', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'Audience',
    label: 'Gestion des audiences',
    actions: [
      { name: 'Créer une nouvelle audience', value: 'create', enabled: true },
      { name: 'Lire la liste des audiences', value: 'read', enabled: true },
      { name: 'Modifier une audience', value: 'update', enabled: true },
      { name: 'Valider une audience', value: 'validate', enabled: true },
      { name: 'Refuser une audience', value: 'refuse', enabled: true },
      { name: 'Archiver une audience', value: 'archive', enabled: true },
      {
        name: 'Mettre une audience en brouillon',
        value: 'draft',
        enabled: true,
      },
      {
        name: 'Assigner un membre à une audience',
        value: 'assign',
        enabled: true,
      },
      { name: 'Supprimer une audience', value: 'delete', enabled: true },
    ],
  },
  {
    menu: 'log',
    label: "Gestion des historiques d'actions",
    actions: [
      { name: 'Créer un nouveau log', value: 'create', enabled: true },
      { name: 'Lire la liste des logs', value: 'read', enabled: true },
      { name: 'Modifier un log', value: 'update', enabled: true },
      { name: 'Supprimer un log', value: 'delete', enabled: true },
      { name: 'Exporter les logs', value: 'export', enabled: true },
      { name: 'Importer des logs', value: 'import', enabled: true },
    ],
  },
  {
    menu: 'dashboard',
    label: 'Tableau de bord',
    actions: [
      {
        name: 'Voir les statistiques du tableau de bord',
        value: 'read_stats',
        enabled: true,
      },
      {
        name: 'Filtrer les statistiques du tableau de bord',
        value: 'filter',
        enabled: true,
      },
      {
        name: 'Voir les 6 derniers bénéficiaires',
        value: 'read_beneficiaries',
        enabled: true,
      },
      {
        name: 'Vooir le graphiques des activités',
        value: 'read_activity_graph',
        enabled: true,
      },
      {
        name: 'Voir le tableau des 15 derniers rapports',
        value: 'read_reports',
        enabled: true,
      },
    ],
  },
];

export default PERMISSIONS;
