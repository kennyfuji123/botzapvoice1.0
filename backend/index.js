const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { MessageMedia } = require('whatsapp-web.js');

const app = express();
app.use(cors());
app.use(express.json());

// Função para garantir que o arquivo aiConfig.json existe
const ensureAIConfigFile = () => {
  try {
    if (!fs.existsSync('aiConfig.json')) {
      fs.writeFileSync('aiConfig.json', JSON.stringify({ isAIEnabled: false }, null, 2));
      console.log('Arquivo aiConfig.json criado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao criar arquivo aiConfig.json:', error);
  }
};

// Chamar a função antes de iniciar o cliente
ensureAIConfigFile();

console.log('Iniciando cliente WhatsApp...');

// Função para limpar diretório de forma recursiva
const clearDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        clearDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    fs.rmdirSync(dir);
  }
};

// Modificar a inicialização do cliente
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'whatsapp-client',
    dataPath: path.join(__dirname, '.wwebjs_auth'),
    onLogout: async () => {
      try {
        const sessionPath = path.join(__dirname, '.wwebjs_auth');
        clearDirectory(sessionPath);
        console.log('Sessão limpa com sucesso');
      } catch (error) {
        console.error('Erro ao limpar sessão:', error);
      }
    }
  }),
  puppeteer: {
    args: ['--no-sandbox']
  }
});

let qrCodeData = null;

client.on('qr', async (qr) => {
  console.log('QR Code recebido, gerando imagem...');
  try {
    qrCodeData = await QRCode.toDataURL(qr);
    console.log('QR Code gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
  }
});

client.on('ready', () => {
  console.log('Cliente WhatsApp está pronto!');
  qrCodeData = null;
});

client.on('authenticated', () => {
  console.log('Cliente autenticado!');
});

client.on('auth_failure', (msg) => {
  console.error('Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
});

client.on('message', async msg => {
  console.log('Mensagem recebida:', msg.body);

  try {
    // Verificar mensagens automáticas
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');
    console.log('Mensagens automáticas carregadas:', autoMessages);

    // Verificar se existe uma mensagem automática que corresponda
    const autoMessage = autoMessages.find(autoMsg =>
      autoMsg.trigger &&
      msg.body.toLowerCase().includes(autoMsg.trigger.toLowerCase())
    );

    if (autoMessage) {
      console.log('Enviando mensagem automática:', autoMessage.response);
      
      // Verificar se é uma resposta em áudio
      if (autoMessage.type === 'audio' && autoMessage.audioFile) {
        const audioPath = path.join(__dirname, 'audios', autoMessage.audioFile);
        if (fs.existsSync(audioPath)) {
          try {
            const media = MessageMedia.fromFilePath(audioPath);
            // Enviar como mensagem de voz nativa
            await client.sendMessage(msg.from, media, {
              sendMediaAsVoice: true,
              caption: autoMessage.response || '',
              mimetype: 'audio/ogg; codecs=opus'
            });
            return;
          } catch (error) {
            console.error('Erro ao enviar mensagem de voz:', error);
            await msg.reply('Desculpe, houve um erro ao processar o áudio.');
            return;
          }
        } else {
          console.error('Arquivo de áudio não encontrado:', audioPath);
          await msg.reply('Desculpe, houve um erro ao processar o áudio.');
          return;
        }
      }
      
      await msg.reply(autoMessage.response);
      return;
    }

    // Se não houver mensagem automática, verificar se a IA está ativa
    const aiConfig = JSON.parse(fs.readFileSync('aiConfig.json', 'utf8') || '{"isAIEnabled": false}');
    console.log('Status da IA ao processar mensagem:', aiConfig.isAIEnabled ? 'ATIVADA' : 'DESATIVADA');

    if (aiConfig.isAIEnabled) {
      console.log('Nenhuma mensagem automática encontrada, usando IA...');
      try {
        // Carregar contexto do negócio
        const businessContext = JSON.parse(fs.readFileSync('businessContext.json', 'utf8'));

        console.log('Fazendo requisição para a IA...');
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "mistral",
            prompt: `Você é um assistente virtual especializado em atendimento ao cliente da ${businessContext.businessName}. 
            Suas características são:
            - Sempre responda em português
            - Seja amigável e prestativo
            - Use linguagem informal e descontraída
            - Mantenha as respostas concisas e diretas
            - Se não souber algo, seja honesto e diga que não sabe
            - Use emojis ocasionalmente para tornar a conversa mais amigável
            - Seja profissional mas não formal
            - Evite respostas muito longas
            - Mantenha um tom positivo e otimista
            
            Informações importantes sobre o negócio:
            - Horário de funcionamento: ${businessContext.businessHours}
            - Produtos principais: ${businessContext.mainProducts.join(', ')}
            - Serviços principais: ${businessContext.mainServices.join(', ')}
            - Taxa de entrega: ${businessContext.pricingInfo.deliveryFee}
            - Pedido mínimo: ${businessContext.pricingInfo.minimumOrder}
            
            Pergunta do cliente: ${msg.body}`,
            stream: false
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Resposta não OK da IA:', response.status, errorText);
          throw new Error(`Erro ao obter resposta da IA: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Resposta bruta da IA:', data);

        if (!data.response) {
          throw new Error('Resposta da IA não contém o campo response');
        }

        const aiResponse = data.response;
        console.log('Resposta processada da IA:', aiResponse);

        await msg.reply(aiResponse);
      } catch (error) {
        console.error('Erro detalhado ao chamar IA:', error);
        await msg.reply('Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente em alguns instantes.');
      }
    } else {
      console.log('IA desativada e nenhuma mensagem automática encontrada - nenhuma resposta será enviada');
    }

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
});

console.log('Iniciando cliente...');
client.initialize().catch(error => {
  console.error('Erro ao inicializar cliente:', error);
});

// Rotas da API
app.post('/api/initialize', (req, res) => {
  console.log('Requisição de inicialização recebida');
  if (qrCodeData) {
    console.log('Enviando QR Code');
    res.json({ qrCode: qrCodeData, status: 'pending' });
  } else {
    console.log('Cliente já conectado');
    res.json({ status: 'connected' });
  }
});

app.get('/api/status', (req, res) => {
  console.log('Verificando status do cliente');
  res.json({ status: client.info ? 'connected' : 'disconnected' });
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { number, message } = req.body;
    console.log('Mensagem recebida:', { number, message });

    if (!client) {
      return res.status(400).json({ error: 'Cliente WhatsApp não inicializado' });
    }

    // Formatar o número do telefone
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
    console.log('Número formatado:', formattedNumber);

    // Verificar mensagens automáticas
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');

    // Verificar se existe uma mensagem automática que corresponda
    const autoMessage = autoMessages.find(msg =>
      msg.trigger &&
      message.toLowerCase().includes(msg.trigger.toLowerCase())
    );

    if (autoMessage) {
      console.log('Enviando mensagem automática');
      await client.sendMessage(formattedNumber, autoMessage.response);
      return res.json({ success: true, message: 'Mensagem automática enviada com sucesso' });
    }

    // Se não houver mensagem automática, usar a IA
    console.log('Fazendo requisição para a IA...');

    // Carregar contexto do negócio
    const businessContext = JSON.parse(fs.readFileSync('businessContext.json', 'utf8'));

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "mistral",
        prompt: `Você é um assistente virtual especializado em atendimento ao cliente da ${businessContext.businessName}. 
        Suas características são:
        - Sempre responda em português
        - Seja amigável e prestativo
        - Use linguagem informal e descontraída
        - Mantenha as respostas concisas e diretas
        - Se não souber algo, seja honesto e diga que não sabe
        - Use emojis ocasionalmente para tornar a conversa mais amigável
        - Seja profissional mas não formal
        - Evite respostas muito longas
        - Mantenha um tom positivo e otimista
        
        Informações importantes sobre o negócio:
        - Horário de funcionamento: ${businessContext.businessHours}
        - Produtos principais: ${businessContext.mainProducts.join(', ')}
        - Serviços principais: ${businessContext.mainServices.join(', ')}
        - Taxa de entrega: ${businessContext.pricingInfo.deliveryFee}
        - Pedido mínimo: ${businessContext.pricingInfo.minimumOrder}
        
        Pergunta do cliente: ${message}`,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resposta não OK da IA:', response.status, errorText);
      throw new Error(`Erro ao obter resposta da IA: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta bruta da IA:', data);

    if (!data.response) {
      throw new Error('Resposta da IA não contém o campo response');
    }

    const aiResponse = data.response;
    console.log('Resposta processada da IA:', aiResponse);

    // Enviar resposta da IA
    await client.sendMessage(formattedNumber, aiResponse);
    res.json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro detalhado ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para gerenciar mensagens automáticas
app.get('/api/auto-messages', (req, res) => {
  try {
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');
    const isAIEnabled = JSON.parse(fs.readFileSync('aiConfig.json', 'utf8') || '{"isAIEnabled": false}').isAIEnabled;
    res.json({ messages: autoMessages, isAIEnabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para controlar o status da IA (DEVE VIR ANTES das rotas com parâmetros)
app.put('/api/auto-messages/ai-status', (req, res) => {
  try {
    console.log('Requisição recebida para alterar status da IA:', req.body);
    const { isAIEnabled } = req.body;

    if (typeof isAIEnabled !== 'boolean') {
      console.error('Valor inválido para isAIEnabled:', isAIEnabled);
      return res.status(400).json({
        error: 'Valor inválido para isAIEnabled. Deve ser um booleano.'
      });
    }

    console.log('Alterando status da IA:', isAIEnabled ? 'ativando' : 'desativando');

    // Garantir que o diretório existe
    const dir = './';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Salvar configuração
    fs.writeFileSync('aiConfig.json', JSON.stringify({ isAIEnabled }, null, 2));

    // Verificar se o arquivo foi atualizado corretamente
    const config = JSON.parse(fs.readFileSync('aiConfig.json', 'utf8'));
    console.log('Status atual da IA:', config.isAIEnabled ? 'ATIVADA' : 'DESATIVADA');

    res.json({
      success: true,
      message: `IA ${config.isAIEnabled ? 'ativada' : 'desativada'} com sucesso`,
      isAIEnabled: config.isAIEnabled
    });
  } catch (error) {
    console.error('Erro ao alterar status da IA:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rota para verificar o status atual da IA
app.get('/api/auto-messages/ai-status', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync('aiConfig.json', 'utf8') || '{"isAIEnabled": false}');
    console.log('Status atual da IA:', config.isAIEnabled ? 'ATIVADA' : 'DESATIVADA');
    res.json({ isAIEnabled: config.isAIEnabled });
  } catch (error) {
    console.error('Erro ao verificar status da IA:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auto-messages', (req, res) => {
  try {
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');
    const newMessage = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    autoMessages.push(newMessage);
    fs.writeFileSync('autoMessages.json', JSON.stringify(autoMessages, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auto-messages/:id', (req, res) => {
  try {
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');
    const index = autoMessages.findIndex(msg => msg.id === parseInt(req.params.id));
    if (index !== -1) {
      autoMessages[index] = { ...autoMessages[index], ...req.body };
      fs.writeFileSync('autoMessages.json', JSON.stringify(autoMessages, null, 2));
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Mensagem não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/auto-messages/:id', (req, res) => {
  try {
    const autoMessages = JSON.parse(fs.readFileSync('autoMessages.json', 'utf8') || '[]');
    const filteredMessages = autoMessages.filter(msg => msg.id !== parseInt(req.params.id));
    fs.writeFileSync('autoMessages.json', JSON.stringify(filteredMessages, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 