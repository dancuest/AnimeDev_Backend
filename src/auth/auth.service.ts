import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithDevice(deviceId: string) {
    // crea o encuentra el usuario
    const user = await this.prisma.user.upsert({
      where: { deviceId },
      update: {},
      create: {
        deviceId,
        // recomendado: crea settings por defecto (evita nulls después)
        settings: { create: {} },
      },
      select: { id: true },
    });

    // genera token (sub = userId)
    // Opción A (la tuya, válida): usa subject
    const access_token = await this.jwt.signAsync({}, { subject: user.id });

    // Opción B (también válida, estándar): payload con sub
    // const access_token = await this.jwt.signAsync({ sub: user.id });

    return { userId: user.id, access_token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deviceId: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid token');
    return user;
  }
}