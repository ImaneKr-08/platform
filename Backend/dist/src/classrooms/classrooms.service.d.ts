import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
export declare class ClassroomsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createClassroomDto: CreateClassroomDto): Promise<{
        name: string;
        id: number;
        building: string;
        capacity: number;
        rows: number;
        columns: number;
    }>;
    findAll(): Promise<({
        _count: {
            tables: number;
        };
    } & {
        name: string;
        id: number;
        building: string;
        capacity: number;
        rows: number;
        columns: number;
    })[]>;
    findOne(id: number): Promise<{
        tables: {
            id: number;
            classroomId: number;
            qrCode: string | null;
            positionX: number;
            positionY: number;
        }[];
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
        name: string;
        id: number;
        building: string;
        capacity: number;
        rows: number;
        columns: number;
    }>;
    update(id: number, updateClassroomDto: UpdateClassroomDto): Promise<{
        name: string;
        id: number;
        building: string;
        capacity: number;
        rows: number;
        columns: number;
    }>;
    remove(id: number): Promise<{
        name: string;
        id: number;
        building: string;
        capacity: number;
        rows: number;
        columns: number;
    }>;
}
