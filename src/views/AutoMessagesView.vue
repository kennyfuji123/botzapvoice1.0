<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Botão Voltar -->
    <div class="mb-6">
      <router-link 
        to="/" 
        class="inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Voltar para Dashboard
      </router-link>
    </div>

    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Mensagens Automáticas</h1>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="contactsStore.isAIEnabled ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-sm font-medium">
              IA {{ contactsStore.isAIEnabled ? 'Ativada' : 'Desativada' }}
            </span>
          </div>
          <button
            @click="toggleAI"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
              contactsStore.isAIEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            ]"
          >
            {{ contactsStore.isAIEnabled ? 'Desativar IA' : 'Ativar IA' }}
          </button>
        </div>
      </div>

      <div class="mb-8">
        <p class="text-gray-600">Configure respostas automáticas para mensagens específicas</p>
      </div>

      <!-- Formulário de nova mensagem automática -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Adicionar Nova Mensagem Automática</h2>
        <form @submit.prevent="addNewAutoMessage" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Palavra-chave ou Frase</label>
            <input
              v-model="newAutoMessage.trigger"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: horário de funcionamento"
              required
            />
            <p class="mt-1 text-sm text-gray-500">A mensagem será enviada quando o usuário mencionar esta palavra ou frase</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Resposta</label>
            <div class="text-xs text-gray-500 mb-1">
              Tags disponíveis: {'nome'}, {'telefone'}, {'grupo'}
            </div>
            <textarea
              v-model="newAutoMessage.response"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="4"
              placeholder="Digite a resposta automática..."
              required
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Adicionar Mensagem Automática
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de mensagens automáticas -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Mensagens Configuradas</h2>
        <div class="space-y-4">
          <div
            v-for="message in autoMessagesStore.getAutoMessages"
            :key="message.id"
            class="border rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-lg">{{ message.trigger }}</h3>
                <p class="text-gray-600 mt-1">{{ message.response }}</p>
                <div class="mt-2">
                  <span class="text-xs text-gray-500">
                    Criado em: {{ new Date(message.createdAt).toLocaleString() }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="editAutoMessage(message)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  Editar
                </button>
                <button
                  @click="autoMessagesStore.removeAutoMessage(message.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensagem de sucesso -->
      <div v-if="autoMessagesStore.successMessage" 
        class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
        {{ autoMessagesStore.successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAutoMessagesStore } from '../stores/autoMessages';
import { useContactsStore } from '../stores/contacts';

const autoMessagesStore = useAutoMessagesStore();
const contactsStore = useContactsStore();

const newAutoMessage = ref({
  trigger: '',
  response: ''
});

onMounted(async () => {
  try {
    console.log('Carregando dados iniciais...');
    await Promise.all([
      autoMessagesStore.loadAutoMessages(),
      contactsStore.loadAutoMessages()
    ]);
    console.log('Dados carregados com sucesso');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    contactsStore.showSuccess('Erro ao carregar dados. Tente recarregar a página.');
  }
});

const toggleAI = async () => {
  try {
    console.log('Iniciando toggle da IA...');
    await contactsStore.toggleAI();
    console.log('Status da IA alterado com sucesso');
    // Recarrega o status da IA após a mudança
    await contactsStore.loadAutoMessages();
  } catch (error) {
    console.error('Erro ao alterar status da IA:', error);
    contactsStore.showSuccess(`Erro ao alterar status da IA: ${error.message}`);
  }
};

const addNewAutoMessage = () => {
  autoMessagesStore.addAutoMessage(newAutoMessage.value);
  newAutoMessage.value = {
    trigger: '',
    response: ''
  };
};

const editAutoMessage = (message) => {
  // Implementar edição de mensagem automática
};
</script> 