<template>
  <div class="bg-white rounded-lg shadow p-6">
    <!-- Formulário de novo contato -->
    <form @submit.prevent="addNewContact" class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
      <button
        type="submit"
        class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Adicionar Contato
      </button>
    </form>

    <!-- Lista de grupos -->
    <div class="mb-6">
      <h3 class="text-lg font-medium mb-2">Grupos</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="group in contactsStore.getGroups"
          :key="group"
          @click="selectedGroup = group"
          :class="[
            'px-3 py-1 rounded-full',
            selectedGroup === group
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ group }}
        </button>
      </div>
    </div>

    <!-- Lista de contatos -->
    <div v-if="selectedGroup">
      <h3 class="text-lg font-medium mb-2">Contatos em {{ selectedGroup }}</h3>
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

    <!-- Modal de envio de mensagem -->
    <div v-if="showMessageModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 class="text-lg font-medium mb-4">Enviar mensagem para {{ selectedGroup }}</h3>
        <textarea
          v-model="messageToSend"
          class="w-full h-32 p-2 border rounded-md mb-4"
          placeholder="Digite sua mensagem..."
        ></textarea>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useContactsStore } from '../stores/contacts';

const contactsStore = useContactsStore();
const selectedGroup = ref(null);
const showMessageModal = ref(false);
const messageToSend = ref('');

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

const editContact = (contact) => {
  // Implementar edição de contato
};

const sendMessageToGroup = async () => {
  if (!messageToSend.value.trim()) return;
  
  const success = await contactsStore.sendMessageToGroup(selectedGroup.value, messageToSend.value);
  if (success) {
    showMessageModal.value = false;
    messageToSend.value = '';
  }
};
</script> 