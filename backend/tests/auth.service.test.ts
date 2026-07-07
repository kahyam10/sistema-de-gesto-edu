import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { authService } from "../src/services/auth.service.js";

describe("AuthService", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  it("registra usuário com senha criptografada e sem expor password", async () => {
    const user = await authService.register({
      email: "novo@teste.com",
      password: "senha-forte-123",
      nome: "Usuário Novo",
      role: "SECRETARIA",
    });

    expect(user.email).toBe("novo@teste.com");
    expect(user).not.toHaveProperty("password");

    const noBanco = await prisma.user.findUnique({
      where: { email: "novo@teste.com" },
    });
    expect(noBanco).not.toBeNull();
    expect(noBanco!.password).not.toBe("senha-forte-123");
    expect(await bcrypt.compare("senha-forte-123", noBanco!.password)).toBe(
      true
    );
  });

  it("rejeita email duplicado", async () => {
    await expect(
      authService.register({
        email: "novo@teste.com",
        password: "outra-senha-123",
        nome: "Duplicado",
        role: "USER",
      })
    ).rejects.toThrow("Email já cadastrado");
  });

  it("faz login com credenciais válidas e não expõe password", async () => {
    const user = await authService.login({
      email: "novo@teste.com",
      password: "senha-forte-123",
    });

    expect(user.email).toBe("novo@teste.com");
    expect(user).not.toHaveProperty("password");
  });

  it("rejeita senha incorreta com mensagem genérica", async () => {
    await expect(
      authService.login({ email: "novo@teste.com", password: "errada-123" })
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("rejeita email inexistente com a mesma mensagem genérica", async () => {
    await expect(
      authService.login({ email: "nao-existe@teste.com", password: "x-123456" })
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("rejeita usuário inativo", async () => {
    await prisma.user.update({
      where: { email: "novo@teste.com" },
      data: { ativo: false },
    });

    await expect(
      authService.login({ email: "novo@teste.com", password: "senha-forte-123" })
    ).rejects.toThrow("Usuário inativo");
  });
});
