import { describe, expect, it } from "vitest";

import { translateAuthError } from "@/lib/auth-errors";

describe("translateAuthError", () => {
  it("translates the weak password notice from the backend", () => {
    expect(
      translateAuthError(
        "Password is known to be weak and easy to guess, please choose a different one.",
      ),
    ).toBe("Essa senha é fraca e fácil de adivinhar. Escolha outra.");
  });

  it("keeps the required length from the backend message", () => {
    expect(translateAuthError("Password should be at least 8 characters.")).toBe(
      "A senha deve ter ao menos 8 caracteres.",
    );
  });

  it("translates a duplicate e-mail", () => {
    expect(translateAuthError("User already registered")).toBe("Este e-mail já está cadastrado.");
  });

  it("translates wrong credentials", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
  });

  it("never returns the original English text for an unknown message", () => {
    const raw = "Some unexpected backend failure occurred";
    const result = translateAuthError(raw, "Não foi possível criar sua conta. Tente novamente.");
    expect(result).toBe("Não foi possível criar sua conta. Tente novamente.");
    expect(result).not.toContain(raw);
  });

  it("uses the fallback when there is no message at all", () => {
    expect(translateAuthError(undefined, "Dados inválidos")).toBe("Dados inválidos");
  });
});
