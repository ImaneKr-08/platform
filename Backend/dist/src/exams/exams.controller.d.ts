import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AssignProfessorDto } from './dto/assign-professor.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
export declare class ExamsController {
    private readonly examsService;
    constructor(examsService: ExamsService);
    create(createExamDto: CreateExamDto): Promise<{
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    }>;
    findAll(): Promise<({
        professor: {
            email: string;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            department: string;
        };
        classroom: {
            name: string;
            id: number;
            building: string;
            capacity: number;
            rows: number;
            columns: number;
        };
        _count: {
            examStudents: number;
        };
    } & {
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    })[]>;
    findOne(id: number): Promise<{
        professor: {
            email: string;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            department: string;
        };
        classroom: {
            name: string;
            id: number;
            building: string;
            capacity: number;
            rows: number;
            columns: number;
        };
        examStudents: ({
            student: {
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
            };
            table: {
                id: number;
                classroomId: number;
                qrCode: string | null;
                positionX: number;
                positionY: number;
            };
        } & {
            id: number;
            examId: number;
            studentId: number;
            tableId: number;
        })[];
        monitoringSessions: {
            id: number;
            startedAt: Date;
            endedAt: Date | null;
            active: boolean;
            examId: number;
        }[];
    } & {
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    }>;
    update(id: number, updateExamDto: UpdateExamDto): Promise<{
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    }>;
    remove(id: number): Promise<{
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    }>;
    assignProfessor(id: number, dto: AssignProfessorDto): Promise<{
        title: string;
        id: number;
        module: string;
        examDate: Date;
        startTime: Date;
        endTime: Date;
        classroomId: number;
        professorId: number;
        status: import("@prisma/client").$Enums.ExamStatus;
    }>;
    assignStudents(id: number, dto: AssignStudentsDto): Promise<any[]>;
    start(id: number): Promise<{
        message: string;
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
        session: {
            id: number;
            startedAt: Date;
            endedAt: Date | null;
            active: boolean;
            examId: number;
        };
    }>;
    end(id: number): Promise<{
        message: string;
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
        session: any;
    }>;
}
