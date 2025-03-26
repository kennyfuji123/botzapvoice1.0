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
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800">Gerenciamento de Contatos</h1>
        <p class="text-gray-600">Gerencie seus contatos e envie mensagens em massa</p>
      </div>

      <!-- Formulário de novo contato -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Adicionar Novo Contato</h2>
        <form @submit.prevent="addNewContact" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nome</label>
            <input
              v-model="newContact.name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              v-model="newContact.phone"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="5513999999999"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Grupo</label>
            <input
              v-model="newContact.group"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Geral"
            />
          </div>
          <div class="md:col-span-3">
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Adicionar Contato
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de grupos e contatos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Grupos -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Grupos</h2>
            <button
              @click="showNewGroupModal = true"
              class="text-blue-600 hover:text-blue-800"
            >
              + Novo Grupo
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="group in contactsStore.getGroups"
              :key="group"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span class="font-medium">{{ group }}</span>
              <div class="flex gap-2">
                <button
                  @click="selectedGroup = group"
                  :class="[
                    'px-3 py-1 rounded-md text-sm',
                    selectedGroup === group
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
                >
                  Selecionar
                </button>
                <button
                  @click="deleteGroup(group)"
                  class="text-red-600 hover:text-red-800"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contatos do grupo selecionado -->
        <div v-if="selectedGroup" class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Contatos em {{ selectedGroup }}</h2>
            <button
              @click="showMessageModal = true"
              class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Enviar Mensagem
            </button>
          </div>
          <div class="space-y-4">
            <div
              v-for="contact in contactsStore.getContactsByGroup(selectedGroup)"
              :key="contact.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p class="font-medium">{{ contact.name }}</p>
                <p class="text-sm text-gray-600">{{ contact.phone }}</p>
              </div>
              <div class="flex gap-2">
                <button
                  @click="editContact(contact)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  Editar
                </button>
                <button
                  @click="contactsStore.removeContact(contact.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de novo grupo -->
      <div v-if="showNewGroupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 class="text-lg font-medium mb-4">Criar Novo Grupo</h3>
          <input
            v-model="newGroupName"
            type="text"
            class="w-full p-2 border rounded-md mb-4"
            placeholder="Nome do grupo"
          />
          <div class="flex justify-end gap-2">
            <button
              @click="showNewGroupModal = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              @click="createNewGroup"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Criar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de envio de mensagem -->
      <div v-if="showMessageModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 class="text-lg font-medium mb-4">Enviar mensagem para {{ selectedGroup }}</h3>
          
          <!-- Informações de segurança -->
          <div class="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 class="text-sm font-medium text-blue-800 mb-2">Diretrizes de Segurança:</h4>
            <ul class="text-xs text-blue-700 space-y-1">
              <li>• Delay de {{ contactsStore.securitySettings.delayBetweenMessages/1000 }}s entre mensagens</li>
              <li>• Máximo de {{ contactsStore.securitySettings.maxMessagesPerMinute }} mensagens por minuto</li>
              <li>• Envio permitido entre {{ contactsStore.securitySettings.allowedHours.start }}h e {{ contactsStore.securitySettings.allowedHours.end }}h</li>
              <li>• Máximo de {{ contactsStore.securitySettings.maxRetries }} tentativas por número</li>
              <li>• Cooldown de 24h após falhas</li>
            </ul>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Agendar envio</label>
            <input
              v-model="scheduledTime"
              type="datetime-local"
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
            <div class="text-xs text-gray-500 mb-1">
              Tags disponíveis: {'nome'}, {'telefone'}, {'grupo'}
            </div>
            <textarea
              v-model="messageToSend"
              class="w-full h-32 p-2 border rounded-md"
              placeholder="Digite sua mensagem..."
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showMessageModal = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              @click="sendMessageToGroup"
              :disabled="contactsStore.isLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ contactsStore.isLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mensagem de sucesso -->
      <div v-if="contactsStore.successMessage" 
        class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
        {{ contactsStore.successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useContactsStore } from '../stores/contacts';

const contactsStore = useContactsStore();
const selectedGroup = ref(null);
const showMessageModal = ref(false);
const showNewGroupModal = ref(false);
const messageToSend = ref('');
const scheduledTime = ref('');
const newGroupName = ref('');

const newContact = ref({
  name: '',
  phone: '',
  group: 'Geral'
});

onMounted(() => {
  contactsStore.loadContacts();
});

const addNewContact = () => {
  contactsStore.addContact(newContact.value);
  newContact.value = {
    name: '',
    phone: '',
    group: 'Geral'
  };
};

const createNewGroup = () => {
  if (newGroupName.value.trim()) {
    contactsStore.addContact({
      name: 'Grupo',
      phone: '00000000000',
      group: newGroupName.value
    });
    newGroupName.value = '';
    showNewGroupModal.value = false;
  }
};

const deleteGroup = (group) => {
  if (confirm(`Tem certeza que deseja excluir o grupo "${group}" e todos os seus contatos?`)) {
    contactsStore.contacts = contactsStore.contacts.filter(contact => contact.group !== group);
    contactsStore.saveContacts();
  }
};

const editContact = (contact) => {
  // Implementar edição de contato
};

const sendMessageToGroup = async () => {
  if (!messageToSend.value.trim()) {
    alert('Por favor, digite uma mensagem');
    return;
  }

  if (!selectedGroup.value) {
    alert('Por favor, selecione um grupo');
    return;
  }

  const groupContacts = contactsStore.getContactsByGroup(selectedGroup.value);
  if (groupContacts.length === 0) {
    alert('Este grupo não possui contatos');
    return;
  }

  // Validar números dos contatos
  const invalidContacts = groupContacts.filter(contact => {
    const phone = contact.phone.replace(/\D/g, '');
    // Verifica se o número começa com 55 e tem 12 ou 13 dígitos
    return !phone.startsWith('55') || (phone.length !== 12 && phone.length !== 13);
  });

  if (invalidContacts.length > 0) {
    const invalidNames = invalidContacts.map(contact => contact.name).join(', ');
    alert(`Os seguintes contatos possuem números inválidos: ${invalidNames}\n\nOs números devem começar com 55 e ter 12 ou 13 dígitos.`);
    return;
  }
  
  const success = await contactsStore.sendMessageToGroup(
    selectedGroup.value, 
    messageToSend.value,
    scheduledTime.value || null
  );

  if (success) {
    showMessageModal.value = false;
    messageToSend.value = '';
    scheduledTime.value = '';
  }
};
</script> 