import { defineStore } from 'pinia'
import { generateAIResponse } from '../services/aiService'
import { whatsappService } from '../services/whatsappService'

export const useBotStore = defineStore('bot', {
  state: () => ({
    status: 'offline',
    messages: [],
    totalMessages: 0,
    activeUsers: 0,
    isLoading: false,
    currentUser: null,
    whatsappStatus: 'disconnected',
    qrCode: null,
    error: null
  }),

  actions: {
    async sendMessage(message, userId, phoneNumber = null) {
      this.isLoading = true
      this.error = null

      try {
        // Adiciona mensagem do usuário
        this.messages.push({
          id: Date.now(),
          text: message,
          sender: 'user',
          userId: userId,
          timestamp: new Date()
        })

        // Gera resposta da IA
        const response = await generateAIResponse(message)

        // Adiciona resposta do bot
        this.messages.push({
          id: Date.now() + 1,
          text: response,
          sender: 'bot',
          userId: userId,
          timestamp: new Date()
        })

        // Se tiver número de telefone, envia pelo WhatsApp
        if (phoneNumber) {
          try {
            await whatsappService.sendMessage(phoneNumber, response)
            console.log('Mensagem enviada com sucesso para:', phoneNumber)
          } catch (whatsappError) {
            console.error('Erro ao enviar mensagem no WhatsApp:', whatsappError)
            this.error = whatsappError.response?.data?.details || 'Erro ao enviar mensagem no WhatsApp'
          }
        }

        this.totalMessages += 2
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
        this.error = error.message || 'Erro ao processar mensagem'
      } finally {
        this.isLoading = false
      }
    },

    async initializeWhatsApp() {
      try {
        const response = await whatsappService.initialize()
        this.qrCode = response.qrCode
        this.whatsappStatus = 'initializing'
      } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error)
        this.whatsappStatus = 'error'
        this.error = error.message || 'Erro ao inicializar WhatsApp'
      }
    },

    async checkWhatsAppStatus() {
      try {
        const response = await whatsappService.getStatus()
        this.whatsappStatus = response.status
        if (response.status === 'connected') {
          this.qrCode = null
        }
      } catch (error) {
        console.error('Erro ao verificar status do WhatsApp:', error)
        this.error = error.message || 'Erro ao verificar status do WhatsApp'
      }
    },

    setStatus(status) {
      this.status = status
    },

    incrementActiveUsers() {
      this.activeUsers++
    },

    decrementActiveUsers() {
      if (this.activeUsers > 0) {
        this.activeUsers--
      }
    },

    setCurrentUser(user) {
      this.currentUser = user
    },

    clearMessages() {
      this.messages = []
      this.totalMessages = 0
    }
  }
})
