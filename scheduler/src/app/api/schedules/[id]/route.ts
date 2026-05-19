import { NextResponse } from 'next/server';
import { PrismaScheduleService } from '../../../../services/serverScheduleService';

const serverService = new PrismaScheduleService();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const schedule = await serverService.updateSchedule(id, body);
    return NextResponse.json(schedule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await serverService.deleteSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete schedule' }, { status: 500 });
  }
}
