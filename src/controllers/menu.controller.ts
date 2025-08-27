import { NextFunction, Request, Response } from 'express';
import MenuModel from '../models/menu.model';

class MenuController {
  static async getMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      const { contributorId } = req.query;
      if (contributorId) {
        filter.contributorId = contributorId;
      }
      const menus = await MenuModel.find(filter).exec();
      if (!menus) {
        res.status(404).json({
          message: 'Aucun menu trouvé',
          data: null,
          success: false,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: menus,
        message: 'Menus récupérés',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MenuController;
