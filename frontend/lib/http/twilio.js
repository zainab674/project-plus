import { api } from ".";

export const createTwilioToken = async (FormData) => api.post('/twilio/token',FormData);