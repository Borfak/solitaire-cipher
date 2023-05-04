require('dotenv').config();
const { Telegraf } = require('telegraf');
const {
  generateKey,
  solitaireEncrypt,
  solitaireDecrypt,
} = require('./solitaire-helpers');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const { KEY_FULL_PATH } = require('./solitaire');

const keyExists = existsSync(KEY_FULL_PATH);

if (!keyExists) {
  const generatedKey = generateKey();
  writeFileSync(KEY_FULL_PATH, generatedKey, 'utf8');
}

const key = readFileSync(KEY_FULL_PATH, 'utf8');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.replyWithHTML(
    `<b>Привіт ${ctx.from.first_name}!</b>\n\nЯ Solitaire Cipher Bot. Я можу шифрувати і розшифровувати ваші повідомлення за допомогою алгоритму Пасьянс. Щоб почати, введіть /help.`
  );
});

bot.help((ctx) => {
  ctx.replyWithHTML(
    `<b>Доступні команди:</b>\n\n<b>/help</b> - вивести цей список команд\n<b>/encrypt <i>текст</i></b> - зашифрувати текст\n<b>/decrypt <i>текст</i></b> - розшифрувати текст`
  );
});

bot.command('encrypt', (ctx) => {
  const args = ctx.message.text.split(' ');
  const text = args.slice(1).join(' ');

  if (!/^[a-zA-Z ]+$/.test(text)) {
    ctx.reply('Будь ласка, введіть текст англійською мовою.');
    return;
  }

  const encrypted = solitaireEncrypt(text, key);

  ctx.replyWithHTML(`<b>Зашифровано:</b>\n<code>${encrypted}</code>`);
});
bot.command('decrypt', (ctx) => {
  const args = ctx.message.text.split(' ');
  const text = args.slice(1).join(' ');

  if (!/^[a-zA-Z ]+$/.test(text)) {
    ctx.reply('Будь ласка, введіть текст англійською мовою.');
    return;
  }

  const decrypted = solitaireDecrypt(text, key);

  ctx.replyWithHTML(`<b>Розшифровано:</b>\n<code>${decrypted}</code>`);
});

bot.launch();
