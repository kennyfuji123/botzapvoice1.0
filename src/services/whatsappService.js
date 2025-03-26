import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.baseURL = 'http://localhost:3003/api';
  }

  async sendMessage(phoneNumber, message) {
    try {
      const response = await axios.post(`${this.baseURL}/send-message`, {
        phoneNumber,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem no WhatsApp:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/status`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter status do WhatsApp:', error);
      throw error;
    }
  }

  async initialize() {
    try {
      const response = await axios.post(`${this.baseURL}/initialize`);
      return response.data;
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService(); 