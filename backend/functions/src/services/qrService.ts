import * as QRCode from 'qrcode';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { db, TIMESTAMP, CONFIG } from '../config';

export interface QRPayload {
  consignmentId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  sourceWarehouse: string;
  destinationFacility: string;
  generatedAt: string;
}

export async function generateQRPayload(consignment: any): Promise<string> {
  const payload: QRPayload = {
    consignmentId: consignment.consignmentId,
    medicineName: consignment.medicineName,
    batchNumber: consignment.batchNumber,
    expiryDate: consignment.expiryDate,
    quantity: consignment.quantity,
    sourceWarehouse: consignment.sourceWarehouse,
    destinationFacility: consignment.destinationFacility,
    generatedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(payload);
  return jsonString;
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a365d',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function saveQRCodeImage(
  consignmentId: string,
  qrDataUrl: string
): Promise<string> {
  const bucket = admin.storage().bucket(CONFIG.storageBucket);
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const fileName = `qrcodes/${consignmentId}.png`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/png',
      metadata: {
        consignmentId,
        generatedAt: new Date().toISOString(),
      },
    },
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2030',
  });

  return url;
}

export function parseQRData(qrData: string): QRPayload | null {
  try {
    const payload: QRPayload = JSON.parse(qrData);

    const requiredFields: (keyof QRPayload)[] = [
      'consignmentId', 'medicineName', 'batchNumber',
      'expiryDate', 'quantity', 'sourceWarehouse', 'destinationFacility',
    ];

    for (const field of requiredFields) {
      if (!payload[field]) {
        console.error(`QR payload missing required field: ${field}`);
        return null;
      }
    }

    return payload;
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return null;
  }
}

export async function generateConsignmentQR(consignment: any): Promise<string> {
  const payloadString = await generateQRPayload(consignment);
  const qrDataUrl = await generateQRCode(payloadString);
  const qrImageUrl = await saveQRCodeImage(consignment.consignmentId, qrDataUrl);

  await db.collection('medicineConsignments').doc(consignment.consignmentId).update({
    qrCodeUrl: qrImageUrl,
    qrCodePayload: payloadString,
  });

  return qrImageUrl;
}
