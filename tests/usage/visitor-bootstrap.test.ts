import assert from "node:assert/strict";
import test from "node:test";
import {
  bootstrapVisitorId,
  VISITOR_ID_COOKIE_NAME,
  VISITOR_ID_STORAGE_KEY,
} from "@/components/usage/VisitorBootstrap";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

test("bootstrapVisitorId uses localStorage value and sets cookie when missing", () => {
  const localStorage = new MemoryStorage();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, "visitor-local");
  let cookieValue = "";

  const visitorId = bootstrapVisitorId({
    localStorage,
    cookie: "",
    setCookie: (value: string) => {
      cookieValue = value;
    },
    crypto: {
      randomUUID: () => "generated-should-not-be-used",
    } as Crypto,
  });

  assert.equal(visitorId, "visitor-local");
  assert.ok(cookieValue.includes(`${VISITOR_ID_COOKIE_NAME}=visitor-local`));
  assert.equal(localStorage.getItem(VISITOR_ID_STORAGE_KEY), "visitor-local");
});

test("bootstrapVisitorId prefers localStorage and overwrites mismatched cookie", () => {
  const localStorage = new MemoryStorage();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, "visitor-local");
  let cookieValue = "";

  const visitorId = bootstrapVisitorId({
    localStorage,
    cookie: `${VISITOR_ID_COOKIE_NAME}=visitor-cookie`,
    setCookie: (value: string) => {
      cookieValue = value;
    },
    crypto: {
      randomUUID: () => "generated-should-not-be-used",
    } as Crypto,
  });

  assert.equal(visitorId, "visitor-local");
  assert.ok(cookieValue.includes(`${VISITOR_ID_COOKIE_NAME}=visitor-local`));
});

test("bootstrapVisitorId uses cookie value when localStorage missing", () => {
  const localStorage = new MemoryStorage();
  let cookieValue = "";

  const visitorId = bootstrapVisitorId({
    localStorage,
    cookie: `${VISITOR_ID_COOKIE_NAME}=visitor-cookie`,
    setCookie: (value: string) => {
      cookieValue = value;
    },
    crypto: {
      randomUUID: () => "generated-should-not-be-used",
    } as Crypto,
  });

  assert.equal(visitorId, "visitor-cookie");
  assert.equal(localStorage.getItem(VISITOR_ID_STORAGE_KEY), "visitor-cookie");
  assert.equal(cookieValue, "");
});

test("bootstrapVisitorId generates id when none found and syncs storage/cookie", () => {
  const localStorage = new MemoryStorage();
  let cookieValue = "";

  const visitorId = bootstrapVisitorId({
    localStorage,
    cookie: "",
    setCookie: (value: string) => {
      cookieValue = value;
    },
    crypto: {
      randomUUID: () => "generated-visitor",
    } as Crypto,
  });

  assert.equal(visitorId, "generated-visitor");
  assert.equal(
    localStorage.getItem(VISITOR_ID_STORAGE_KEY),
    "generated-visitor",
  );
  assert.ok(
    cookieValue.includes(`${VISITOR_ID_COOKIE_NAME}=generated-visitor`),
  );
});

test("bootstrapVisitorId guards malformed cookie values", () => {
  const localStorage = new MemoryStorage();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, "visitor-local");
  let cookieValue = "";

  const visitorId = bootstrapVisitorId({
    localStorage,
    cookie: `${VISITOR_ID_COOKIE_NAME}=%E0%A4%A`,
    setCookie: (value: string) => {
      cookieValue = value;
    },
    crypto: {
      randomUUID: () => "generated-should-not-be-used",
    } as Crypto,
  });

  assert.equal(visitorId, "visitor-local");
  assert.ok(cookieValue.includes(`${VISITOR_ID_COOKIE_NAME}=visitor-local`));
});

test("bootstrapVisitorId sets Secure flag when on https", () => {
  const localStorage = new MemoryStorage();
  const originalLocation = globalThis.location;
  let cookieValue = "";

  try {
    Object.defineProperty(globalThis, "location", {
      value: { protocol: "https:" },
      configurable: true,
    });

    bootstrapVisitorId({
      localStorage,
      cookie: "",
      setCookie: (value: string) => {
        cookieValue = value;
      },
      crypto: {
        randomUUID: () => "generated-visitor",
      } as Crypto,
    });
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: originalLocation,
      configurable: true,
    });
  }

  assert.ok(cookieValue.includes("Secure"));
});
