import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

interface TOTPResponse {
  secret: string;
  qrCode: string;
}

// Générer un secret TOTP et un QR code
export const generateTOTP = async (email: string): Promise<TOTPResponse> => {
  const secret = authenticator.generateSecret(); // Génère un secret compatible base32
  const otpauthUrl = authenticator.keyuri(email, 'ValDeli', secret);
  const qrCode = await qrcode.toDataURL(otpauthUrl);

  return {
    secret,
    qrCode,
  };
};

// Vérifier un token TOTP
export const verifyTOTP = (token: string, secret: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
};
