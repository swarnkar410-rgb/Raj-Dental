import { AppointmentRequest } from '../models/AppointmentRequest';

export const sendWhatsAppNotification = async (
  request: any,
  templateType: 'approved' | 'rejected' | 'reschedule',
  extra?: { newDate?: string; newTime?: string }
): Promise<boolean> => {
  try {
    let message = '';
    const patientName = request.patientName;
    const treatment = request.treatmentType;
    const date = request.date;
    const time = request.timeSlot;

    if (templateType === 'approved') {
      message = `🦷 Raj Dental & Implant Hospital\n\nHello ${patientName},\n\nYour appointment has been APPROVED.\n\n📅 Date: ${date}\n🕒 Time: ${time}\n🩺 Treatment: ${treatment}\n\nPlease arrive 10 minutes early.`;
    } else if (templateType === 'rejected') {
      message = `🦷 Raj Dental & Implant Hospital\n\nHello ${patientName},\n\nUnfortunately your requested slot is unavailable.\n\nPlease submit a new appointment request or contact the clinic.`;
    } else if (templateType === 'reschedule') {
      message = `🦷 Raj Dental & Implant Hospital\n\nYour appointment has been rescheduled and confirmed.\n\nNew Date: ${extra?.newDate || date}\nNew Time: ${extra?.newTime || time}\nTreatment: ${treatment}\n\nPlease arrive 10 minutes before your appointment.`;
    }

    console.log(`[WHATSAPP MOCK] Sending to ${request.patientPhone}: \n${message}`);

    // Update tracking fields
    request.notificationStatus = 'SENT';
    request.sentAt = new Date();
    request.notificationType = 'whatsapp';
    request.deliveryStatus = 'Delivered successfully via WhatsApp Gateway';
    await request.save();

    return true;
  } catch (error: any) {
    request.notificationStatus = 'FAILED';
    request.sentAt = new Date();
    request.notificationType = 'whatsapp';
    request.deliveryStatus = error.message || 'WhatsApp Gateway Timeout';
    await request.save();
    return false;
  }
};
