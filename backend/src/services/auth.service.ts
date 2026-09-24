import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { RegisterInput, LoginInput } from "../schemas/index.js";

// Hash de uma senha aleatória: quando o e-mail não existe o login ainda faz um
// bcrypt.compare, para o tempo de resposta não revelar quais e-mails existem.
const HASH_FICTICIO = bcrypt.hashSync(randomBytes(16).toString("hex"), 10);

export class LoginInvalidoError extends Error {
  constructor(
    public motivo: "CREDENCIAIS" | "INATIVO",
    public userId: string | null
  ) {
    super(motivo === "INATIVO" ? "Usuário inativo" : "Credenciais inválidas");
    this.name = "LoginInvalidoError";
  }
}

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nome: data.nome,
        role: data.role,
        escolaId: data.escolaId,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        escola: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { escola: true },
    });

    // Sempre compara (mesmo sem usuário) — tempo constante entre os casos
    const senhaOk = await bcrypt.compare(data.password, user?.password ?? HASH_FICTICIO);

    if (!user || !senhaOk) {
      throw new LoginInvalidoError("CREDENCIAIS", user?.id ?? null);
    }

    // Só revela "inativo" para quem acertou a senha
    if (!user.ativo) {
      throw new LoginInvalidoError("INATIVO", user.id);
    }

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        escolaId: true,
        escola: true,
        profissionalId: true,
        ativo: true,
        createdAt: true,
      },
    });

    return user;
  }
}

export const authService = new AuthService();
