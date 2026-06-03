"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StudentsService = class StudentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createStudentDto) {
        const emailExists = await this.prisma.student.findUnique({
            where: { email: createStudentDto.email },
        });
        if (emailExists) {
            throw new common_1.ConflictException('Email already registered for a student');
        }
        const codeExists = await this.prisma.student.findUnique({
            where: { studentCode: createStudentDto.studentCode },
        });
        if (codeExists) {
            throw new common_1.ConflictException('Student code already registered');
        }
        if (createStudentDto.braceletId) {
            const braceletExists = await this.prisma.student.findUnique({
                where: { braceletId: createStudentDto.braceletId },
            });
            if (braceletExists) {
                throw new common_1.ConflictException('Bracelet already assigned to another student');
            }
        }
        return this.prisma.student.create({
            data: createStudentDto,
        });
    }
    async findAll(paginationDto, department) {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (department) {
            where.department = department;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { studentCode: { contains: search } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: { lastName: 'asc' },
            }),
            this.prisma.student.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                examStudents: {
                    include: {
                        exam: true,
                        table: true,
                    },
                },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student with ID ${id} not found`);
        }
        return student;
    }
    async update(id, updateStudentDto) {
        await this.findOne(id);
        if (updateStudentDto.email) {
            const emailExists = await this.prisma.student.findFirst({
                where: { email: updateStudentDto.email, NOT: { id } },
            });
            if (emailExists) {
                throw new common_1.ConflictException('Email already registered for another student');
            }
        }
        if (updateStudentDto.studentCode) {
            const codeExists = await this.prisma.student.findFirst({
                where: { studentCode: updateStudentDto.studentCode, NOT: { id } },
            });
            if (codeExists) {
                throw new common_1.ConflictException('Student code already registered for another student');
            }
        }
        if (updateStudentDto.braceletId) {
            const braceletExists = await this.prisma.student.findFirst({
                where: { braceletId: updateStudentDto.braceletId, NOT: { id } },
            });
            if (braceletExists) {
                throw new common_1.ConflictException('Bracelet already assigned to another student');
            }
        }
        return this.prisma.student.update({
            where: { id },
            data: updateStudentDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.student.delete({
            where: { id },
        });
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map