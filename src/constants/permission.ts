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
      { name: 'Créer un nouveau membre', value: 'create', enabled: false },
      { name: 'Lire la liste des membres', value: 'read', enabled: false },
      {
        name: 'Voir les détails du membre',
        value: 'viewDetails',
        enabled: false,
      },
      { name: 'Modifier un membre', value: 'update', enabled: false },
      {
        name: 'Modifier le mot de passe',
        value: 'update_password',
        enabled: false,
      },
      { name: 'Modifier le rôle', value: 'update_role', enabled: false },
      { name: 'Supprimer un membre', value: 'delete', enabled: false },
      { name: 'Exporter les membres', value: 'export', enabled: false },
      { name: 'Importer des membres', value: 'import', enabled: false },
      { name: 'Valider un membre', value: 'validate', enabled: false },
      { name: 'Gérer les permissions', value: 'permissions', enabled: false },
    ],
  },
  {
    menu: 'Activités',
    label: 'Gestion des activités',
    actions: [
      { name: 'Créer une nouvelle activité', value: 'create', enabled: false },
      { name: 'Lire la liste des activités', value: 'read', enabled: false },
      { name: 'Modifier une activité', value: 'update', enabled: false },
      { name: 'Supprimer une activité', value: 'delete', enabled: false },
    ],
  },
  {
    menu: 'Rapports',
    label: 'Gestion des rapports',
    actions: [
      { name: 'Créer un nouveau rapport', value: 'create', enabled: false },
      { name: 'Lire la liste des rapports', value: 'read', enabled: false },
      { name: 'Modifier un rapport', value: 'update', enabled: false },
      { name: 'Supprimer un rapport', value: 'delete', enabled: false },
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
];

export default PERMISSIONS;
