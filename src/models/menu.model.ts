import mongoose, { Document } from 'mongoose';

interface IMenu extends Document {
  label: string;
  contributorId: mongoose.Types.ObjectId;
  href: string;
}

const schemaMenu = new mongoose.Schema<IMenu>(
  {
    label: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: true,
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },
  },
  { timestamps: true }
);

// Création d'un schéma pour le modèle
mongoose.Schema.Types.ObjectId.set('toJSON', {
  transform: function (id: any) {
    return id.toString();
  },
});

// Création d'un index pour la recherche rapide
schemaMenu.index({ label: 1, href: 1 }, { unique: true });

const MenuModel = mongoose.model<IMenu>('Menu', schemaMenu);

export default MenuModel;
