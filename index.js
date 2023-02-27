const TelegramBot = require('node-telegram-bot-api');
const { Configuration, OpenAIApi } = require('openai');
const ytdl = require('ytdl-core');
const Unsplash = require('unsplash-js').default;
const { toJson } = require('unsplash-js');

// Load environment variables
require('dotenv').config();

// Configurar la API de Telegram
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Configurar la API de OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Hola, soy RogueAi y estoy aquí para ayudarte.
    Cuento con las siguientes funcionalidades:
    - Puedo generar respuestas a tus mensajes utilizando la API de OpenAI.
    - Puedo enviarte una imagen de lo que me pidas utilizando la API de Unsplash.
    - Puedo enviarte una canción que me pidas utilizando la API de OpenAI y Youtube.
    - Puedo generar imágenes utilizando la API de OpenAI.
    
    No necesitas usar ningún comando para utilizar mis funcionalidades, solo envíame un mensaje y yo te responderé.
    
    Ejemplos:
    - Explicame la teoría de la relatividad
    - Cuanto es 12 * 8?
    - enviame una imagen de perros
    - generame una imagen de un perro con gafas
    - descargame la canción de la pelicula top gun

    `
  );
});

// Handle messages from the user
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  if (message.startsWith('descargame el tema')) {
    // Ask gpt-3 to find the youtube video url and download the song.
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Provide youtube url of the mentioned song:' + message,
      max_tokens: 50,
      temperature: 0.5,
    });

    // Download the song from youtube.
    const url = response.data.choices[0].text;
    const songInfo = await ytdl.getInfo(url);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    // Send the song to the user.
    bot.sendMessage(chatId, `Descargando ${song.title}`);
    bot.sendAudio(chatId, song.url);
  } else if (message.startsWith('generame una imagen de')) {
    // TODO: Generar una imagen utilizando la API de OpenAI

    // For now just tell the user the feature is not yet developed.
    bot.sendMessage(chatId, 'Esta funcionalidad aún no está disponible.');
  } else if (message.startsWith('enviame una imagen de')) {
    // Buscar una imagen en la web utilizando la API de unsplash
    const query = message.substring(21);
    const unsplash = new Unsplash({
      accessKey: process.env.ACCESS_KEY,
    });
    const response = await unsplash.search.photos(query, 1, 1);
    const image = toJson(response).results[0];

    // Enviar la imagen al usuario
    bot.sendPhoto(chatId, image.urls.regular);
  } else {
    // Procesar el mensaje del usuario utilizando la API de OpenAI
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: message,
      max_tokens: 50,
      temperature: 0.5,
    });

    // Enviar la respuesta del bot al usuario
    bot.sendMessage(chatId, response.data.choices[0].text);
  }
});
