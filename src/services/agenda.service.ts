import Agenda, { IAgenda } from '../models/agenda.model';

export class AgendaService {
  static async create(agendaData: Partial<IAgenda>): Promise<IAgenda> {
    const agenda = new Agenda(agendaData);
    return await agenda.save();
  }

  static async findAll(): Promise<IAgenda[]> {
    return await Agenda.find().sort({ start: 1 });
  }

  static async findById(id: string): Promise<IAgenda | null> {
    return await Agenda.findById(id);
  }

  static async update(
    id: string,
    agendaData: Partial<IAgenda>
  ): Promise<IAgenda | null> {
    return await Agenda.findByIdAndUpdate(id, agendaData, {
      new: true,
      runValidators: true,
    });
  }

  static async delete(id: string): Promise<IAgenda | null> {
    return await Agenda.findByIdAndDelete(id);
  }

  static async findByDateRange(start: Date, end: Date): Promise<IAgenda[]> {
    return await Agenda.find({
      $or: [
        { start: { $gte: start, $lte: end } },
        { end: { $gte: start, $lte: end } },
        { $and: [{ start: { $lte: start } }, { end: { $gte: end } }] },
      ],
    }).sort({ start: 1 });
  }

  // Nouvelles méthodes pour gérer les événements par ownerId
  static async findByOwnerId(ownerId: string): Promise<IAgenda[]> {
    return await Agenda.find({ ownerId }).sort({ start: 1 });
  }

  static async findByOwnerIdAndDateRange(
    ownerId: string,
    start: Date,
    end: Date
  ): Promise<IAgenda[]> {
    return await Agenda.find({
      ownerId,
      $or: [
        { start: { $gte: start, $lte: end } },
        { end: { $gte: start, $lte: end } },
        { $and: [{ start: { $lte: start } }, { end: { $gte: end } }] },
      ],
    }).sort({ start: 1 });
  }

  static async updateByOwnerId(
    id: string,
    ownerId: string,
    agendaData: Partial<IAgenda>
  ): Promise<IAgenda | null> {
    return await Agenda.findOneAndUpdate({ _id: id, ownerId }, agendaData, {
      new: true,
      runValidators: true,
    });
  }

  static async deleteByOwnerId(
    id: string,
    ownerId: string
  ): Promise<IAgenda | null> {
    return await Agenda.findOneAndDelete({ _id: id, ownerId });
  }
}
