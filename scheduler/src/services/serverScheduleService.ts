import { prisma } from '../lib/db';
import { Schedule, CreateScheduleInput, UpdateScheduleInput, ScheduleCategory } from '../types/schedule';

export class PrismaScheduleService {
  async getSchedules(): Promise<Schedule[]> {
    const data = await prisma.schedule.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      category: item.category as ScheduleCategory,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      hasTime: item.hasTime,
    }));
  }

  async createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const item = await prisma.schedule.create({
      data: {
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        category: input.category,
        isCompleted: false,
        hasTime: input.hasTime ?? true,
      },
    });
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      category: item.category as ScheduleCategory,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      hasTime: item.hasTime,
    };
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.startTime !== undefined) updateData.startTime = new Date(input.startTime);
    if (input.endTime !== undefined) updateData.endTime = new Date(input.endTime);
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isCompleted !== undefined) updateData.isCompleted = input.isCompleted;
    if (input.hasTime !== undefined) updateData.hasTime = input.hasTime;

    const item = await prisma.schedule.update({
      where: { id },
      data: updateData,
    });

    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      category: item.category as ScheduleCategory,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      hasTime: item.hasTime,
    };
  }

  async deleteSchedule(id: string): Promise<void> {
    await prisma.schedule.delete({
      where: { id },
    });
  }
}
