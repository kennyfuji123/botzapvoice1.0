import axios from 'axios';

async function generateAIResponse(message) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "neural-chat",
      prompt: `Você é um assistente virtual amigável e prestativo. Responda de forma concisa e natural.
            Pergunta: ${message}`,
      stream: false
    });

    if (!response.data || !response.data.response) {
      throw new Error('Resposta inválida da IA');
    }

    return response.data.response;
  } catch (error) {
    console.error('Erro ao gerar resposta com IA:', error);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    return 'Olá! Parece que estou tendo um pequeno problema para processar sua mensagem. Pode tentar novamente em alguns instantes?';
  }
}

export { generateAIResponse }; 