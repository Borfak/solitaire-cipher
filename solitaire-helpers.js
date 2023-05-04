const chalk = require('chalk');

const ALLOWED_KEY_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KEY_LENGTH = 2048;
const DECK_SIZE = 54;
const JOKER_A = 53;
const ALPHABET_LENGTH = 26;
const ASCII_ALPHABET_START_INDEX = 65;

// Випадковий текст, на який ми будемо зміняти пробіли (чим довше - тим менше ймовірність
// випадкового перетинання зі справжнім текстом, але тим більше буде фінальна зашифрована стрічка)
const SPACE_ESCAPE_SEQUENCE = 'CVBEIDXXXP'
const SPACE_ESCAPE_SEQUENCE_REGEX = new RegExp(SPACE_ESCAPE_SEQUENCE, 'g')

// Генерація псевдовипадкової послідовності з використанням алгоритму шифрування Solitaire
function generateKeyStream(deck) {
  const jokers = [JOKER_A, DECK_SIZE];
  let keyStream = '';
  let keyCard;

  // Основний крок шифрування Solitaire - перемішування колоди
  for (let i = 0; i < DECK_SIZE; i++) {
    const card = deck[i];
    let move = 1;

    // Якщо поточна карта - джокер, то визначити кількість переміщень залежно від його положення в колоді
    if (jokers.includes(card)) {
      const jokerIndex = deck.indexOf(card);
      move = jokerIndex < JOKER_A ? 1 : 2;
    } else {
      // В іншому випадку, перемістити карту на кількість позицій, що дорівнює її значенню
      move = card % DECK_SIZE;
      if (move + i > JOKER_A) {
        move = move - (DECK_SIZE - i);
      }
    }

    // Виконати переміщення карти в колоді
    deck.splice(i, 1);
    deck.splice(i + move, 0, card);
  }

  // Визначити, які карти використовувати для генерації псевдовипадкової послідовності
  while (keyStream.length <= DECK_SIZE) {
    // Обрати першу карту, яка не є джокером
    while (jokers.includes(deck[0])) {
      deck.splice(0, 1);
    }

    // Перемістити обрану карту на кількість позицій, що дорівнює її значенню
    keyCard = deck[0];
    const move = keyCard % DECK_SIZE;
    deck.splice(0, 1);
    deck.splice(move, 0, keyCard);

    // Додати символ у псевдовипадкову послідовність на основі двох верхніх карт у колоді
    const topCards = deck.slice(0, 2);
    const sum = topCards[0] + topCards[1];
    const letterIndex = sum % ALPHABET_LENGTH;
    keyStream += String.fromCharCode(ASCII_ALPHABET_START_INDEX + letterIndex);
  }

  return keyStream;
}

// Шифрування тексту за допомогою алгоритму шифрування Solitaire
// Функція вертає або зашифрований текст, або null - що є індикатором того, що при виконанні функції сталася помилка
function solitaireEncrypt(plaintext, key) {
  // Замінюємо пробіли на SPACE_ESCAPE_SEQUENCE
  plaintext = plaintext.replace(/[ ]/g, SPACE_ESCAPE_SEQUENCE);

  // Перетворення тексту у верхній регістр і видалення всіх символів, крім букв
  plaintext = plaintext.toUpperCase().replace(/[^A-Z]/g, '');

  if (plaintext.length > KEY_LENGTH) {
    console.error(
      chalk.yellow(`[WARNING] The message length cannot exceed the key length (${KEY_LENGTH} characters).`)
    )
    console.error(
      chalk.yellow(`Note: Each space in the message increases it's size by ${SPACE_ESCAPE_SEQUENCE} bytes (i.e. characters).`)
    )
    console.error(
      chalk.yellow('The characters that are not English letters are automatically removed, thus decreasing the message length.')
    )
    console.error(
      chalk.yellow('Exiting the program..')
    )

    return
  }

  // Створення колоди карт (від 1 до 52 - звичайні карти, JOKER_A і DECK_SIZE - джокери)
  let deck = [];
  for (let i = 1; i <= DECK_SIZE; i++) {
    deck.push(i);
  }

  // Генерація псевдовипадкової послідовності з використанням ключа
  let keyStream = '';
  for (let i = 0; i < key.length; i++) {
    const letterIndex = key.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    keyStream += String.fromCharCode(ASCII_ALPHABET_START_INDEX + letterIndex);
  }
  while (keyStream.length < plaintext.length) {
    keyStream += generateKeyStream(deck);
  }
  keyStream = keyStream.slice(0, plaintext.length);

  // Шифрування тексту побітово
  let ciphertext = '';
  for (let i = 0; i < plaintext.length; i++) {
    const plainLetterIndex = plaintext.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    const keyLetterIndex = keyStream.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    const cipherLetterIndex = (plainLetterIndex + keyLetterIndex) % ALPHABET_LENGTH;
    ciphertext += String.fromCharCode(ASCII_ALPHABET_START_INDEX + cipherLetterIndex);
  }

  // Розбивка зашифрованого тексту на групи по 5 символів
  let groups = [];
  for (let i = 0; i < ciphertext.length; i += 5) {
    groups.push(ciphertext.slice(i, i + 5));
  }

  // Повернення зашифрованого тексту у вигляді рядка з пробілами між групами
  return groups.join(' ');
}

// Розшифрування тексту за допомогою алгоритму шифрування Solitaire
function solitaireDecrypt(ciphertext, key) {
  // Видалення пробілів із зашифрованого тексту
  ciphertext = ciphertext.replace(/\s/g, '');

  // Створення колоди карт (від 1 до 52 - звичайні карти, JOKER_A і DECK_SIZE - джокери)
  let deck = [];
  for (let i = 1; i <= DECK_SIZE; i++) {
    deck.push(i);
  }

  // Генерація псевдовипадкової послідовності з використанням ключа
  let keyStream = '';
  for (let i = 0; i < key.length; i++) {
    const letterIndex = key.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    keyStream += String.fromCharCode(ASCII_ALPHABET_START_INDEX + letterIndex);
  }
  while (keyStream.length < ciphertext.length) {
    keyStream += generateKeyStream(deck);
  }
  keyStream = keyStream.slice(0, ciphertext.length);

  // Розшифрування тексту побітово
  let plaintext = '';
  for (let i = 0; i < ciphertext.length; i++) {
    const cipherLetterIndex = ciphertext.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    const keyLetterIndex = keyStream.charCodeAt(i) - ASCII_ALPHABET_START_INDEX;
    const plainLetterIndex =
      (cipherLetterIndex - keyLetterIndex + ALPHABET_LENGTH) % ALPHABET_LENGTH;
    plaintext += String.fromCharCode(ASCII_ALPHABET_START_INDEX + plainLetterIndex);
  }

  plaintext = plaintext.replace(SPACE_ESCAPE_SEQUENCE_REGEX, ' ');

  // Повернення розшифрованого тексту
  return plaintext;
}

// Функція генерації псевдовипадкової послідовності на основі колоди карт
function generateKeyStream(deck) {
  // Перемішування колоди карт
  deck = shuffle(deck);

  // Переміщення джокерів
  let jokerAIndex = deck.indexOf(JOKER_A);
  let jokerBIndex = deck.indexOf(DECK_SIZE);
  if (jokerAIndex > jokerBIndex) {
    [jokerAIndex, jokerBIndex] = [jokerBIndex, jokerAIndex];
  }
  if (jokerAIndex === JOKER_A) {
    // Якщо верхній джокер перебуває на останній позиції, то він переноситься на другу позицію колоди
    deck.splice(jokerAIndex, 1);
    deck.splice(1, 0, JOKER_A);
    jokerAIndex = 1;
  }
  if (jokerBIndex === DECK_SIZE) {
    // Якщо нижній джокер знаходиться на останній позиції, то він переноситься на першу позицію колоди
    deck.splice(jokerBIndex, 1);
    deck.splice(0, 0, DECK_SIZE);
    jokerBIndex = 0;
  }

  // Переміщення карт між джокерами
  const distance = jokerBIndex - jokerAIndex;
  if (distance === 1) {
    //Якщо джокери знаходяться поруч, то карта між ними переноситься на останню позицію колоди
    deck.splice(jokerAIndex, 1);
    deck.splice(jokerBIndex, 0, deck[jokerAIndex]);
  } else if (distance === 2) {
    // Якщо між джокерами знаходиться одна карта, то вона переноситься на останню позицію колоди
    deck.splice(jokerAIndex, 1);
    deck.splice(jokerBIndex - 1, 0, deck[jokerAIndex]);
  } else {
    // Інакше карти між джокерами переміщуються на одну позицію вниз (з кінця на початок колоди)
    const cardsBetweenJokers = deck.slice(jokerAIndex + 1, jokerBIndex);
    deck = [
      ...deck.slice(0, jokerAIndex + 1),
      ...deck.slice(jokerBIndex),
      ...cardsBetweenJokers,
    ];
  }

  // Переміщення карт відповідно до першої карти колоди
  const firstCardValue = deck[0];
  let moveAmount = firstCardValue;
  if (firstCardValue === JOKER_A || firstCardValue === DECK_SIZE) {
    // Якщо перша карта є джокером, то він переміщується на одну позицію вниз (з кінця на початок колоди)
    moveAmount = 1;
  }
  const movedCards = deck.splice(0, moveAmount);
  deck = [...deck, ...movedCards];

  // Генерація псевдовипадкової послідовності на основі колоди карт
  const keyStream = [];
  let indexA = 0;
  let indexB = 0;
  while (keyStream.length < plaintext.length) {
    // Переміщення першого джокера
    indexA = deck.indexOf(JOKER_A);
    const moveAmountA = indexA + 1;
    const movedCardsA = deck.splice(0, moveAmountA);
    deck = [...deck, ...movedCardsA];
    // Переміщення другого джокера
    indexB = deck.indexOf(DECK_SIZE);
    const moveAmountB = indexB + 2;
    const movedCardsB = deck.splice(0, moveAmountB);
    deck = [...deck, ...movedCardsB];

    // Обмін картами між джокерами
    const distance = indexB - indexA;
    if (distance === 1) {
      deck.splice(indexA, 2, deck[indexB], deck[indexA]);
    } else {
      const cardsBetweenJokers = deck.slice(indexA + 1, indexB);
      deck = [...deck.slice(0, indexA + 1), deck[indexB],
      ...cardsBetweenJokers,
      deck[indexA],
      ...deck.slice(indexB + 1),
      ];
    }

    // Генерація псевдовипадкової літери
    const topCardValue = deck[0];
    let keyLetterIndex = topCardValue - 1;
    if (topCardValue === JOKER_A || topCardValue === DECK_SIZE) {
      //Якщо верхня карта є джокером, то наступна карта після джокера є псевдовипадковою буквою
      keyLetterIndex = deck[1] - 1;
    }
    keyStream.push(String.fromCharCode(ASCII_ALPHABET_START_INDEX + keyLetterIndex));
  }

  // Повернення псевдовипадкової послідовності
  return keyStream.join('');
}

// Функція перемішування колоди карт
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Функція яка генерує ключ шифрування
function generateKey() {
  let key = '';

  for (let i = 0; i < KEY_LENGTH; ++i) {
    key += ALLOWED_KEY_CHARACTERS.charAt(Math.floor(Math.random() * ALLOWED_KEY_CHARACTERS.length));
  }

  return key;
}

module.exports = {
  solitaireEncrypt,
  solitaireDecrypt,
  shuffle,
  generateKey,
};

const plaintext = ' ';

