import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createStudentDto: CreateStudentDto): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        department: string;
        studentCode: string;
        braceletId: string | null;
        heartRate: number | null;
        stressScore: number | null;
        stressLevel: import("@prisma/client").$Enums.StressLevel | null;
        connected: boolean;
        lastUpdate: Date | null;
    }>;
    findAll(paginationDto: PaginationDto, department?: string): Promise<{
        items: {
            email: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            department: string;
            studentCode: string;
            braceletId: string | null;
            heartRate: number | null;
            stressScore: number | null;
            stressLevel: import("@prisma/client").$Enums.StressLevel | null;
            connected: boolean;
            lastUpdate: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        examStudents: ({
            table: {
                id: number;
                classroomId: number;
                qrCode: string | null;
                positionX: number;
                positionY: number;
            };
            exam: {
                title: string;
                id: number;
                module: string;
                examDate: Date;
                startTime: Date;
                endTime: Date;
                classroomId: number;
                professorId: number;
                status: import("@prisma/client").$Enums.ExamStatus;
            };
        } & {
            id: number;
            examId: number;
            studentId: number;
            tableId: number;
        })[];
    } & {
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        department: string;
        studentCode: string;
        braceletId: string | null;
        heartRate: number | null;
        stressScore: number | null;
        stressLevel: import("@prisma/client").$Enums.StressLevel | null;
        connected: boolean;
        lastUpdate: Date | null;
    }>;
    update(id: number, updateStudentDto: UpdateStudentDto): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        department: string;
        studentCode: string;
        braceletId: string | null;
        heartRate: number | null;
        stressScore: number | null;
        stressLevel: import("@prisma/client").$Enums.StressLevel | null;
        connected: boolean;
        lastUpdate: Date | null;
    }>;
    remove(id: number): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        department: string;
        studentCode: string;
        braceletId: string | null;
        heartRate: number | null;
        stressScore: number | null;
        stressLevel: import("@prisma/client").$Enums.StressLevel | null;
        connected: boolean;
        lastUpdate: Date | null;
    }>;
}
