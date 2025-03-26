import { defineStore } from 'pinia';

export const useAutoMessagesStore = defineStore('autoMessages', {
  state: () => ({
    autoMessages: [],
    isLoading: false,
    error: null,
    successMessage: null,
    isAIEnabled: false
  }),

  getters: {
    getAutoMessages: (state) => state.autoMessages,
    getAIStatus: (state) => state.isAIEnabled
  },

  actions: {
    async loadAutoMessages() {
      try {
        this.isLoading = true;
        const response = await fetch('http://localhost:3003/api/auto-messages');
        if (!response.ok) throw new Error('Erro ao carregar mensagens');
        const data = await response.json();
        this.autoMessages = data.messages;
        this.isAIEnabled = data.isAIEnabled;
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async addAutoMessage(message) {
      try {
        this.isLoading = true;
        const response = await fetch('http://localhost:3003/api/auto-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (!response.ok) throw new Error('Erro ao adicionar mensagem');

        await this.loadAutoMessages();
        this.showSuccess('Mensagem automática adicionada com sucesso!');
      } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async updateAutoMessage(id, updatedMessage) {
      try {
        this.isLoading = true;
        const response = await fetch(`http://localhost:3003/api/auto-messages/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedMessage)
        });

        if (!response.ok) throw new Error('Erro ao atualizar mensagem');

        await this.loadAutoMessages();
        this.showSuccess('Mensagem automática atualizada com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar mensagem:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async removeAutoMessage(id) {
      try {
        this.isLoading = true;
        const response = await fetch(`http://localhost:3003/api/auto-messages/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao remover mensagem');

        await this.loadAutoMessages();
        this.showSuccess('Mensagem automática removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover mensagem:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async toggleAI(enabled) {
      try {
        this.isLoading = true;
        const response = await fetch('http://localhost:3003/api/auto-messages/ai-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isAIEnabled: enabled })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status da IA');

        this.isAIEnabled = enabled;
        this.showSuccess(enabled ? 'IA ativada com sucesso!' : 'IA desativada com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar status da IA:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    showSuccess(message) {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }
  }
}); 