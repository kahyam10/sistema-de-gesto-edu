import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma.js";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export class RefreshTokenService {
  /**
   * Gera um novo refresh token para o usuário
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Valida e rotaciona o refresh token (rotation strategy)
   * Retorna o usuário se válido, null caso contrário
   */
  async rotateRefreshToken(oldToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nome: true,
            role: true,
            ativo: true,
            escola: true,
            escolaId: true,
          },
        },
      },
    });

    if (!storedToken) {
      return null;
    }

    // Se o token já foi revogado, é possível reutilização maliciosa
    // Revogar todos os tokens do usuário por segurança
    if (storedToken.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
      return null;
    }

    // Token expirado
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      return null;
    }

    // Usuário inativo
    if (!storedToken.user.ativo) {
      return null;
    }

    // Revogar o token antigo (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Gerar novo refresh token
    const newToken = await this.generateRefreshToken(storedToken.userId);

    return {
      user: storedToken.user,
      refreshToken: newToken,
    };
  }

  /**
   * Revoga todos os refresh tokens de um usuário (logout de todos os dispositivos)
   */
  async revokeAllUserTokens(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Revoga um refresh token específico (logout)
   */
  async revokeToken(token: string) {
    await prisma.refreshToken.updateMany({
      where: { token, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Limpa tokens expirados (manutenção)
   */
  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revoked: true,
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });
    return result.count;
  }
}

export const refreshTokenService = new RefreshTokenService();
