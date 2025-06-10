import Don, { IDon } from '../models/don.model';

class DonService {
  /**
   * Create a new donation.
   * @param donData - The data for the new donation.
   * @returns The created donation.
   */
  public static async createDon(donData: Partial<IDon>): Promise<IDon> {
    const don = new Don(donData);
    await don.save();
    return don;
  }

  /**
   * Get all donations.
   * @returns A list of all donations.
   */
  public static async getAllDons(): Promise<IDon[]> {
    return Don.find().populate('beneficiaire');
  }

  /**
   * Get a donation by ID.
   * @param donId - The ID of the donation.
   * @returns The donation with the specified ID, or null if not found.
   */
  public static async getDonById(donId: string): Promise<IDon | null> {
    return Don.findById(donId).populate('beneficiaire');
  }

  /**
   * Update a donation by ID.
   * @param donId - The ID of the donation to update.
   * @param updateData - The data to update the donation with.
   * @returns The updated donation, or null if not found.
   */
  public static async updateDon(
    donId: string,
    updateData: Partial<IDon>
  ): Promise<IDon | null> {
    return Don.findByIdAndUpdate(donId, updateData, { new: true }).populate(
      'beneficiaire'
    );
  }

  /**
   * Delete a donation by ID.
   * @param donId - The ID of the donation to delete.
   * @returns The deleted donation, or null if not found.
   */
  public static async deleteDon(donId: string): Promise<IDon | null> {
    return Don.findByIdAndDelete(donId).populate('beneficiaire');
  }
}

export default DonService;
