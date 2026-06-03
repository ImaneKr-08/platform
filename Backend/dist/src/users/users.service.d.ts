import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        name: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: number): Promise<{
        professor: {
            email: string;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            department: string;
        } | null;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        createdAt: Date;
    } | null>;
}
