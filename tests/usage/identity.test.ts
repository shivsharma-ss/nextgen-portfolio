import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVisitorIdentity,
  hashVisitorFingerprint,
} from "@/lib/usage/identity";

const withEnv = <T>(
  updates: { USAGE_SALT?: string; NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?: string },
  run: () => T,
) => {
  const previous = {
    USAGE_SALT: process.env.USAGE_SALT,
    NEXT_PUBLIC_CHATKIT_WORKFLOW_ID:
      process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID,
  };

  if (Object.hasOwn(updates, "USAGE_SALT")) {
    if (updates.USAGE_SALT === undefined) {
      delete process.env.USAGE_SALT;
    } else {
      process.env.USAGE_SALT = updates.USAGE_SALT;
    }
  }

  if (Object.hasOwn(updates, "NEXT_PUBLIC_CHATKIT_WORKFLOW_ID")) {
    if (updates.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID === undefined) {
      delete process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID;
    } else {
      process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID =
        updates.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID;
    }
  }

  try {
    return run();
  } finally {
    if (previous.USAGE_SALT === undefined) {
      delete process.env.USAGE_SALT;
    } else {
      process.env.USAGE_SALT = previous.USAGE_SALT;
    }

    if (previous.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID === undefined) {
      delete process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID;
    } else {
      process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID =
        previous.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID;
    }
  }
};

test("buildVisitorIdentity returns authenticated identity for clerk users", () => {
  const result = buildVisitorIdentity({
    ip: "203.0.113.42",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    visitorId: "visitor-123",
    clerkUserId: "user_abc123",
  });

  assert.deepEqual(result, {
    subject: "user_abc123",
    tier: "authenticated",
  });
});

test("buildVisitorIdentity returns guest identity for anonymous visitors", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const ip = "198.51.100.10";
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    const visitorId = "visitor-999";
    const expectedHash = hashVisitorFingerprint(ip, userAgent);

    const result = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId,
    });

    assert.deepEqual(result, {
      subject: expectedHash,
      tier: "guest",
    });
  });
});

test("buildVisitorIdentity avoids fingerprint collisions with delimiter", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const visitorId = "visitor-collision";
    const first = buildVisitorIdentity({
      ip: "ab",
      userAgent: "c",
      visitorId,
    });
    const second = buildVisitorIdentity({
      ip: "a",
      userAgent: "bc",
      visitorId,
    });

    assert.notEqual(first.subject, second.subject);
  });
});

test("buildVisitorIdentity treats empty clerkUserId as guest", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const ip = "203.0.113.21";
    const userAgent = "Mozilla/5.0 (X11; Linux x86_64)";
    const result = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId: "visitor-empty",
      clerkUserId: "",
    });

    assert.equal(result.tier, "guest");
    assert.equal(result.subject, hashVisitorFingerprint(ip, userAgent));
  });
});

test("buildVisitorIdentity ignores visitorId when ip is present", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const ip = "203.0.113.80";
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
    const first = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId: "visitor-1",
    });
    const second = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId: "visitor-2",
    });

    assert.equal(first.subject, second.subject);
    assert.equal(first.subject, hashVisitorFingerprint(ip, userAgent));
  });
});

test("buildVisitorIdentity uses visitorId when ip is empty", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const ip = "";
    const userAgent = "Mozilla/5.0 (Android 14; Mobile; rv:122.0)";
    const first = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId: "visitor-a",
    });
    const second = buildVisitorIdentity({
      ip,
      userAgent,
      visitorId: "visitor-b",
    });

    assert.notEqual(first.subject, second.subject);
    assert.equal(first.subject, hashVisitorFingerprint("visitor-a", userAgent));
    assert.equal(
      second.subject,
      hashVisitorFingerprint("visitor-b", userAgent),
    );
  });
});
