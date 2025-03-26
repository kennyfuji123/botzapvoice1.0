import { defineStore } from 'pinia';

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [],
    autoMessages: [],
    isAIEnabled: false,
    isLoading: false,
    error: null,
    scheduledMessages: [],
    successMessage: null,
    // Contadores de segurança
    messagesSentInLastMinute: 0,
    lastMessageSentTime: null,
    failedAttempts: {},
    // Configurações de segurança
    securitySettings: {
      delayBetweenMessages: 3000, // 3 segundos entre mensagens
      maxMessagesPerMinute: 20, // Máximo de mensagens por minuto
      allowedHours: {
        start: 8, // 8h
        end: 20 // 20h
      },
      maxRetries: 3, // Máximo de tentativas por número
      cooldownPeriod: 24 * 60 * 60 * 1000 // 24 horas de cooldown após falhas
    }
  }),

  actions: {
    addContact(contact) {
      this.contacts.push({
        id: Date.now(),
        name: contact.name,
        phone: contact.phone,
        group: contact.group || 'Geral',
        createdAt: new Date()
      });
      this.saveContacts();
      this.showSuccess('Contato adicionado com sucesso!');
    },

    removeContact(id) {
      this.contacts = this.contacts.filter(contact => contact.id !== id);
      this.saveContacts();
      this.showSuccess('Contato removido com sucesso!');
    },

    updateContact(id, updatedContact) {
      const index = this.contacts.findIndex(contact => contact.id === id);
      if (index !== -1) {
        this.contacts[index] = { ...this.contacts[index], ...updatedContact };
        this.saveContacts();
        this.showSuccess('Contato atualizado com sucesso!');
      }
    },

    saveContacts() {
      localStorage.setItem('whatsapp-contacts', JSON.stringify(this.contacts));
    },

    loadContacts() {
      const savedContacts = localStorage.getItem('whatsapp-contacts');
      if (savedContacts) {
        this.contacts = JSON.parse(savedContacts);
      }
    },

    async loadAutoMessages() {
      try {
        const response = await fetch('http://localhost:3003/api/auto-messages');
        if (!response.ok) {
          throw new Error('Erro ao carregar mensagens automáticas');
        }
        const data = await response.json();
        this.autoMessages = data.messages;
        this.isAIEnabled = data.isAIEnabled;
      } catch (error) {
        console.error('Erro ao carregar mensagens automáticas:', error);
      }
    },

    async addAutoMessage(message) {
      try {
        const response = await fetch('http://localhost:3003/api/auto-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          await this.loadAutoMessages();
          this.showSuccess('Mensagem automática adicionada com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao adicionar mensagem automática:', error);
      }
    },

    async deleteAutoMessage(id) {
      try {
        const response = await fetch(`http://localhost:3003/api/auto-messages/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await this.loadAutoMessages();
          this.showSuccess('Mensagem automática removida com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao remover mensagem automática:', error);
      }
    },

    async toggleAI() {
      try {
        console.log('Tentando alterar status da IA para:', !this.isAIEnabled);
        const response = await fetch('http://localhost:3003/api/auto-messages/ai-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isAIEnabled: !this.isAIEnabled })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao alterar status da IA');
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!data.success) {
          throw new Error(data.message || 'Erro ao alterar status da IA');
        }

        this.isAIEnabled = data.isAIEnabled;
        this.showSuccess(data.message);
      } catch (error) {
        console.error('Erro detalhado ao alterar status da IA:', error);
        this.showSuccess(`Erro ao alterar status da IA: ${error.message}`);
        throw error; // Re-throw para que o componente possa tratar
      }
    },

    showSuccess(message) {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    },

    async sendMessageToGroup(group, message, scheduledTime = null) {
      this.isLoading = true;
      this.error = null;

      try {
        const groupContacts = this.contacts.filter(contact => contact.group === group);

        if (scheduledTime) {
          // Agendar mensagem
          const scheduledDate = new Date(scheduledTime);
          const now = new Date();

          if (scheduledDate <= now) {
            throw new Error('A data de agendamento deve ser futura');
          }

          const delay = scheduledDate.getTime() - now.getTime();

          setTimeout(async () => {
            await this.sendMessagesWithDelay(groupContacts, message);
          }, delay);

          this.scheduledMessages.push({
            id: Date.now(),
            group,
            message,
            scheduledTime: scheduledDate,
            status: 'scheduled'
          });

          this.showSuccess('Mensagem agendada com sucesso!');
          return true;
        } else {
          // Enviar imediatamente
          await this.sendMessagesWithDelay(groupContacts, message);
          this.showSuccess('Mensagens enviadas com sucesso!');
          return true;
        }
      } catch (error) {
        this.error = `Erro ao enviar mensagem para o grupo: ${error.message}`;
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessagesWithDelay(contacts, message) {
      for (const contact of contacts) {
        try {
          // Verificar horário permitido
          const now = new Date();
          const currentHour = now.getHours();
          if (currentHour < this.securitySettings.allowedHours.start ||
            currentHour >= this.securitySettings.allowedHours.end) {
            throw new Error(`Envio permitido apenas entre ${this.securitySettings.allowedHours.start}h e ${this.securitySettings.allowedHours.end}h`);
          }

          // Verificar limite de mensagens por minuto
          if (this.messagesSentInLastMinute >= this.securitySettings.maxMessagesPerMinute) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // Esperar 1 minuto
            this.messagesSentInLastMinute = 0;
          }

          // Verificar delay entre mensagens
          if (this.lastMessageSentTime) {
            const timeSinceLastMessage = now.getTime() - this.lastMessageSentTime;
            if (timeSinceLastMessage < this.securitySettings.delayBetweenMessages) {
              await new Promise(resolve =>
                setTimeout(resolve, this.securitySettings.delayBetweenMessages - timeSinceLastMessage)
              );
            }
          }

          // Verificar tentativas falhas
          if (this.failedAttempts[contact.phone]) {
            const { count, lastAttempt } = this.failedAttempts[contact.phone];
            if (count >= this.securitySettings.maxRetries) {
              const timeSinceLastAttempt = now.getTime() - lastAttempt;
              if (timeSinceLastAttempt < this.securitySettings.cooldownPeriod) {
                throw new Error(`Número em cooldown por excesso de tentativas falhas`);
              }
              // Resetar contador após período de cooldown
              this.failedAttempts[contact.phone] = { count: 0, lastAttempt: now.getTime() };
            }
          }

          await this.sendMessageToContact(contact, message);

          // Atualizar contadores de sucesso
          this.messagesSentInLastMinute++;
          this.lastMessageSentTime = now.getTime();

          // Resetar contador de falhas em caso de sucesso
          if (this.failedAttempts[contact.phone]) {
            delete this.failedAttempts[contact.phone];
          }

        } catch (error) {
          console.error(`Erro ao enviar mensagem para ${contact.phone}:`, error);

          // Registrar tentativa falha
          if (!this.failedAttempts[contact.phone]) {
            this.failedAttempts[contact.phone] = { count: 0, lastAttempt: now.getTime() };
          }
          this.failedAttempts[contact.phone].count++;
          this.failedAttempts[contact.phone].lastAttempt = now.getTime();

          // Se atingiu o limite de tentativas, mostrar mensagem específica
          if (this.failedAttempts[contact.phone].count >= this.securitySettings.maxRetries) {
            this.showSuccess(`Número ${contact.phone} atingiu limite de tentativas. Aguarde 24h antes de tentar novamente.`);
          }
        }
      }
    },

    async sendMessageToContact(contact, message) {
      try {
        // Substituir tags na mensagem
        const processedMessage = this.processMessageTags(message, contact);

        // Validação do número
        if (!contact.phone) {
          throw new Error('Número de telefone não fornecido');
        }

        // Formatação do número
        let formattedNumber = contact.phone.replace(/\D/g, '');
        if (!formattedNumber.startsWith('55')) {
          formattedNumber = '55' + formattedNumber;
        }
        if (!formattedNumber.endsWith('@c.us')) {
          formattedNumber = formattedNumber + '@c.us';
        }

        console.log('Enviando mensagem para:', formattedNumber);

        const response = await fetch('http://localhost:3003/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: formattedNumber,
            message: processedMessage
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar mensagem');
        }

        return true;
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw new Error(`Erro ao enviar mensagem para ${contact.phone}: ${error.message}`);
      }
    },

    processMessageTags(message, contact) {
      return message.replace(/\{(\w+)\}/g, (match, tag) => {
        switch (tag.toLowerCase()) {
          case 'nome':
            return contact.name;
          case 'telefone':
            return contact.phone;
          case 'grupo':
            return contact.group;
          default:
            return match;
        }
      });
    },

    cancelScheduledMessage(id) {
      this.scheduledMessages = this.scheduledMessages.filter(msg => msg.id !== id);
      this.showSuccess('Mensagem agendada cancelada com sucesso!');
    }
  },

  getters: {
    getGroups: (state) => {
      return [...new Set(state.contacts.map(contact => contact.group))];
    },

    getContactsByGroup: (state) => (group) => {
      return state.contacts.filter(contact => contact.group === group);
    },

    getScheduledMessages: (state) => {
      return state.scheduledMessages.sort((a, b) => a.scheduledTime - b.scheduledTime);
    }
  }
}); 