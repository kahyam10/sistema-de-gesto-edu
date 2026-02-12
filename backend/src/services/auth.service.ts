import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { RegisterInput, LoginInput } from "../schemas/index.js";

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
    // Bypass para usuário admin de desenvolvimento
    if (data.email === "admin@kssoft.com.br" && data.password === "1234") {
      return {
        id: "dev-admin-id",
        email: "admin@kssoft.com.br",
        nome: "Administrador (Dev)",
        role: "ADMIN",
        escola: null,
        escolaId: null,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { escola: true },
    });

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    if (!user.ativo) {
      throw new Error("Usuário inativo");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      throw new Error("Credenciais inválidas");
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
        escola: true,
        ativo: true,
        createdAt: true,
      },
    });

    return user;
  }
}

export const authService = new AuthService();
