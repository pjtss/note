import { NextResponse } from 'next/server';
import { PrismaScheduleService } from '../../../services/serverScheduleService';

const serverService = new PrismaScheduleService();

export async function GET() {
  try {
    const schedules = await serverService.getSchedules();
    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schedule = await serverService.createSchedule(body);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create schedule' }, { status: 500 });
  }
}
