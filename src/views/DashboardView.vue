<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-lg">
      <div class="p-4">
        <h1 class="text-2xl font-bold text-gray-800">Bot WhatsApp</h1>
      </div>
      <nav class="mt-4">
        <a href="#" class="flex items-center px-4 py-2 text-gray-700 bg-gray-100">
          <span class="mx-4">Dashboard</span>
        </a>
        <router-link to="/contacts" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
          <span class="mx-4">Contatos</span>
        </router-link>
        <a href="#" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
          <span class="mx-4">Configurações</span>
        </a>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Status Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Status do Bot</h2>
          <div class="flex items-center">
            <div :class="['w-3 h-3 rounded-full mr-2', bot.status === 'online' ? 'bg-green-500' : 'bg-red-500']"></div>
            <span class="text-gray-700">{{ bot.status === 'online' ? 'Online' : 'Offline' }}</span>
          </div>
        </div>

        <!-- WhatsApp Status Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Status WhatsApp</h2>
          <div class="flex items-center">
            <div :class="['w-3 h-3 rounded-full mr-2',
              bot.whatsappStatus === 'connected' ? 'bg-green-500' :
                bot.whatsappStatus === 'initializing' ? 'bg-yellow-500' :
                  'bg-red-500']"></div>
            <span class="text-gray-700">
              {{ bot.whatsappStatus === 'connected' ? 'Conectado' :
                bot.whatsappStatus === 'initializing' ? 'Inicializando' :
                  'Desconectado' }}
            </span>
          </div>
          <button v-if="bot.whatsappStatus === 'disconnected'" @click="initializeWhatsApp"
            class="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Conectar WhatsApp
          </button>
        </div>

        <!-- Messages Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Mensagens</h2>
          <p class="text-3xl font-bold text-blue-500">{{ bot.totalMessages }}</p>
          <p class="text-gray-500">Total de mensagens</p>
        </div>

        <!-- Users Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Usuários</h2>
          <p class="text-3xl font-bold text-green-500">{{ bot.activeUsers }}</p>
          <p class="text-gray-500">Usuários ativos</p>
        </div>

        <!-- Card de Contatos -->
        <router-link to="/contacts" class="block">
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Contatos</h3>
                <p class="text-gray-600">Gerencie seus contatos e grupos</p>
              </div>
              <div class="text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </router-link>

        <!-- Card de Mensagens Automáticas -->
        <router-link to="/auto-messages" class="block">
          <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Mensagens Automáticas</h3>
                <p class="text-gray-600">Configure respostas automáticas</p>
              </div>
              <div class="text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- QR Code Modal -->
      <div v-if="bot.qrCode" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg">
          <h2 class="text-xl font-bold mb-4">Escaneie o QR Code</h2>
          <img :src="bot.qrCode" alt="QR Code WhatsApp" class="w-64 h-64">
          <p class="mt-4 text-gray-600">Abra o WhatsApp no seu celular e escaneie o QR Code para conectar</p>
        </div>
      </div>

      <!-- Chat Preview -->
      <div class="mt-8 bg-white rounded-lg shadow">
        <div class="p-6">
          <h2 class="text-lg font-semibold mb-4">Preview do Chat</h2>
          <div v-if="bot.error" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {{ bot.error }}
          </div>
          <div class="h-96 overflow-y-auto border rounded-lg p-4">
            <div class="space-y-4">
              <div v-for="(msg, index) in bot.messages" :key="index" 
                :class="['flex', msg.isUser ? 'justify-end' : 'justify-start']">
                <div :class="[
                  'max-w-[70%] rounded-lg p-3',
                  msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                ]">
                  {{ msg.text }}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <input
              v-model="message"
              type="text"
              placeholder="Digite sua mensagem..."
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              @keyup.enter="sendMessage"
            />
            <input
              v-model="whatsappNumber"
              type="text"
              placeholder="Número WhatsApp (opcional)"
              class="w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              @click="sendMessage"
              :disabled="bot.isLoading"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ bot.isLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useBotStore } from '../stores/bot'

const bot = useBotStore()
const message = ref('')
const whatsappNumber = ref('')
let statusInterval

onMounted(() => {
  bot.setStatus('online')
  bot.incrementActiveUsers()
  bot.checkWhatsAppStatus()

  // Verifica status do WhatsApp a cada 5 segundos
  statusInterval = setInterval(() => {
    bot.checkWhatsAppStatus()
  }, 5000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})

const initializeWhatsApp = async () => {
  await bot.initializeWhatsApp()
}

const sendMessage = async () => {
  if (!message.value.trim()) return

  await bot.sendMessage(message.value, whatsappNumber.value)
  message.value = ''
  whatsappNumber.value = ''
}
</script>
