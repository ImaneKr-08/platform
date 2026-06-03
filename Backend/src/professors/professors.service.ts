import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

  async create(createProfessorDto: CreateProfessorDto) {
    const { firstName, lastName, email, department, password } = createProfessorDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: 'PROFESSOR',
        },
      });

      return tx.professor.create({
        data: {
          firstName,
          lastName,
          email,
          department,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.professor.findMany({
      include: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: number) {
    const professor = await this.prisma.professor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
        },
        exams: true,
      },
    });

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${id} not found`);
    }

    return professor;
  }

  async update(id: number, updateProfessorDto: UpdateProfessorDto) {
    const prof = await this.findOne(id);
    const { firstName, lastName, email, department, password } = updateProfessorDto;

    if (email && email !== prof.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const userUpdateData: any = {};
      if (firstName || lastName) {
        const newFirst = firstName || prof.firstName;
        const newLast = lastName || prof.lastName;
        userUpdateData.name = `${newFirst} ${newLast}`;
      }
      if (email) {
        userUpdateData.email = email;
      }
      if (password) {
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: prof.userId },
          data: userUpdateData,
        });
      }

      return tx.professor.update({
        where: { id },
        data: {
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          email: email ?? undefined,
          department: department ?? undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    const prof = await this.findOne(id);
    return this.prisma.user.delete({
      where: { id: prof.userId },
    });
  }
}
