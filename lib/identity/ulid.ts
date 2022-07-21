// Universally Unique Lexicographically Sortable Identifier
// source: https://github.com/ulid/javascript/blob/master/lib/index.ts
export interface ULID {
  (seedTime?: number): string;
}

// PRNG = pseudo-random number generator
export interface PseudoRandomNG {
  (): number;
}

export interface LibError extends Error {
  source: string;
}

function createError(message: string): LibError {
  const err = new Error(message) as LibError;
  err.source = "ulid";
  return err;
}

// These values should NEVER change. If
// they do, we're no longer making ulids!
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

export function replaceCharAt(str: string, index: number, char: string) {
  if (index > str.length - 1) {
    return str;
  }
  return str.substr(0, index) + char + str.substr(index + 1);
}

export function incrementBase32(str: string): string {
  let done: string | undefined = undefined;
  let index = str.length;
  let char;
  let charIndex;
  const maxCharIndex = ENCODING_LEN - 1;
  while (!done && index-- >= 0) {
    char = str[index];
    charIndex = ENCODING.indexOf(char);
    if (charIndex === -1) {
      throw createError("incorrectly encoded string");
    }
    if (charIndex === maxCharIndex) {
      str = replaceCharAt(str, index, ENCODING[0]);
      continue;
    }
    done = replaceCharAt(str, index, ENCODING[charIndex + 1]);
  }
  if (typeof done === "string") {
    return done;
  }
  throw createError("cannot increment this string");
}

export function randomChar(prng: PseudoRandomNG): string {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand);
}

export function encodeTime(now: number, len: number): string {
  if (isNaN(now)) {
    throw new Error(now + " must be a number");
  }
  if (now > TIME_MAX) {
    throw createError("cannot encode time greater than " + TIME_MAX);
  }
  if (now < 0) {
    throw createError("time must be positive");
  }
  if (Number.isInteger(now) === false) {
    throw createError("time must be an integer");
  }
  let mod;
  let str = "";
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

export function encodeRandom(len: number, prng: PseudoRandomNG): string {
  let str = "";
  for (; len > 0; len--) {
    str = randomChar(prng) + str;
  }
  return str;
}

export function decodeTime(id: string): number {
  if (id.length !== TIME_LEN + RANDOM_LEN) {
    throw createError("malformed ulid");
  }
  const time = id
    .substring(0, TIME_LEN)
    .split("")
    .reverse()
    .reduce((carry, char, index) => {
      const encodingIndex = ENCODING.indexOf(char);
      if (encodingIndex === -1) {
        throw createError("invalid character found: " + char);
      }
      return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
    }, 0);
  if (time > TIME_MAX) {
    throw createError("malformed ulid, timestamp too large");
  }
  return time;
}

export function detectPrng(): PseudoRandomNG {
  return () => {
    const buffer = new Uint8Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / 0xff;
  };
}

export function ulidFactory(suppliedPRNG?: PseudoRandomNG): ULID {
  const currPrng = suppliedPRNG ?? detectPrng();
  return function ulid(seedTime?: number): string {
    if (!seedTime || isNaN(seedTime)) {
      seedTime = Date.now();
    }
    return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN, currPrng);
  };
}

export function monotonicUlidFactory(suppliedPRNG?: PseudoRandomNG): ULID {
  const currPrng = suppliedPRNG ?? detectPrng();
  let lastTime = 0;
  let lastRandom: string;
  return function ulid(seedTime?: number): string {
    if (!seedTime || isNaN(seedTime)) {
      seedTime = Date.now();
    }
    if (seedTime <= lastTime) {
      const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
      return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
    }
    lastTime = seedTime;
    const newRandom = (lastRandom = encodeRandom(RANDOM_LEN, currPrng));
    return encodeTime(seedTime, TIME_LEN) + newRandom;
  };
}

export const ulid = ulidFactory();
export const monotonicUlid = monotonicUlidFactory();
