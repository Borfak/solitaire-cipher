const chalk = require('chalk');
const fs = require('fs');

const {
  solitaireEncrypt, solitaireDecrypt, generateKey,
} = require('./solitaire-helpers');

const KEY_PATH = './';
const KEY_FILENAME = 'solitaire.key';
const KEY_FULL_PATH = KEY_PATH + KEY_FILENAME;

// Головна функція, яка буде викликатись при запуску програми
const main = () => {
  // Отримуємо масив аргументів командного рядка
  const args = process.argv.slice(2)
  const argMap = {}

  // Якщо передано аргумент --help, то виводимо довідку
  if (args.includes('--help')) {
    console.log(
      chalk.cyan('Usage: node solitare.js --encrypt <string>')
    )
    console.log(
      chalk.cyan('OR: node solitare.js --decrypt <encrypted string>')
    )
    console.log(
      chalk.green('Example: node solitare.js --encrypt "SOME TEXT"')
    )
    console.log()
    console.log('Options:')
    console.log('--encrypt <string> - String you want to encrypt using Solitare Cipher')
    console.log('--decrypt <string> - String you want to decrypt using Solitare Cipher')
    console.log('--generateKey - Generates a new key for Solitare Cipher')
    return
  }

  // Ітеруємось по масиву аргументів та створюємо об'єкт з аргументами (тобто, трансформуємо щось накшталт ['--encrypt', 'SOME TEXT'] в { encrypt: 'SOME TEXT' })
  args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const value = args[index + 1]
      argMap[key] = value
    }
  })

  const {
    encrypt, decrypt,
  } = argMap

  // Якщо не передано жодного аргумента, то виводимо помилку
  if (Object.keys(argMap).length === 0) {
    console.error(
      chalk.red('[ERROR] No arguments provided. Please use --help for more information.')
    )
    return
  }

  // Якщо передано аргумент --generateKey, то генеруємо новий ключ
  if (args.includes('--generateKey')) {
    console.info(
      chalk.cyan('[INFO] Generating new key...')
    )

    const key = generateKey()

    console.info(
      chalk.green('[SUCCESS] Generated new key, saving it to the file...')
    )

    // Синхронно записуємо ключ у файл
    fs.writeFileSync(KEY_FULL_PATH, key, 'utf8')

    console.info(
      chalk.green(`[SUCCESS] Saved key to the file ${KEY_FULL_PATH}.`)
    )

    return
  }

  // Перевіряєм чи існує файл з ключем, якщо ні - виводимо помилку
  const keyExists = fs.existsSync(KEY_FULL_PATH)

  if (!keyExists) {
    console.error(
      chalk.red('[ERROR] Key file does not exist. Please generate a new key using --generateKey.')
    )
    return
  }

  // Якщо передано одночасно аргументи --encrypt та --decrypt, то виводимо помилку
  if (encrypt && decrypt) {
    console.error(
      chalk.red('[ERROR] Too many arguments. Please use either --encrypt or --decrypt.')
    )
    return
  }

  // Зчитуємо ключ з файлу
  const key = fs.readFileSync(KEY_FULL_PATH, 'utf8')

  // Якщо передано аргумент --encrypt, то шифруємо текст
  if (encrypt) {
    const encryptedText = solitaireEncrypt(encrypt, key)

    if (!encryptedText) {
      return
    }

    console.info(
      chalk.green(`[SUCCESS] Encrypted text: ${encryptedText}`)
    )
    return
  }

  // Якщо передано аргумент --decrypt, то дешифруємо текст
  if (decrypt) {
    const decryptedText = solitaireDecrypt(decrypt, key)
    console.info(
      chalk.green(`[SUCCESS] Decrypted text: ${decryptedText}`)
    )
    return
  }
}

main()
