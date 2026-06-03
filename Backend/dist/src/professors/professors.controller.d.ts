import { ProfessorsService } from './professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
export declare class ProfessorsController {
    private readonly professorsService;
    constructor(professorsService: ProfessorsService);
    create(createProfessorDto: CreateProfessorDto): Promise<{
        user: {
            role: import("@prisma/client").$Enums.Role;
            id: number;
            createdAt: Date;
        };
    } & {
        email: string;
        id: number;
        firstName: string;
        lastName: string;
        department: string;
        userId: number;
    }>;
    findAll(): Promise<({
        user: {
            role: import("@prisma/client").$Enums.Role;
            id: number;
            createdAt: Date;
        };
    } & {
        email: string;
        id: number;
        firstName: string;
        lastName: string;
        department: string;
        userId: number;
    })[]>;
    findOne(id: number): Promise<{
        user: {
            role: import("@prisma/client").$Enums.Role;
            id: number;
            createdAt: Date;
        };
        exams: {
            title: string;
            id: number;
            module: string;
            examDate: Date;
            startTime: Date;
            endTime: Date;
            classroomId: number;
            professorId: number;
            status: import("@prisma/client").$Enums.ExamStatus;
        }[];
    } & {
        email: string;
        id: number;
        firstName: string;
        lastName: string;
        department: string;
        userId: number;
    }>;
    update(id: number, updateProfessorDto: UpdateProfessorDto): Promise<{
        user: {
            role: import("@prisma/client").$Enums.Role;
            id: number;
        };
    } & {
        email: string;
        id: number;
        firstName: string;
        lastName: string;
        department: string;
        userId: number;
    }>;
    remove(id: number): Promise<{
        name: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
