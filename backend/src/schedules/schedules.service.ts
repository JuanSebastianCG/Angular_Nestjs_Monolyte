import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Schedule.name)
    private scheduleModel: Model<ScheduleDocument>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // Check for schedule conflicts
    const conflictingSchedule = await this.checkForConflicts(
      createScheduleDto.days,
      createScheduleDto.startTime,
      createScheduleDto.endTime,
      createScheduleDto.room,
      createScheduleDto.startDate,
      createScheduleDto.endDate,
    );

    if (conflictingSchedule) {
      throw new ConflictException(
        'Schedule conflicts with an existing schedule',
      );
    }

    const newSchedule = new this.scheduleModel(createScheduleDto);
    return newSchedule.save();
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleModel.find().exec();
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleModel.findById(id).exec();

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const updatedSchedule = await this.scheduleModel
      .findByIdAndUpdate(id, updateScheduleDto, { new: true })
      .exec();

    if (!updatedSchedule) {
      throw new NotFoundException(
        `Schedule with ID ${id} not found after update`,
      );
    }

    return updatedSchedule;
  }

  async remove(id: string): Promise<void> {
    const result = await this.scheduleModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
  }

  async findByDay(day: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ days: day }).exec();
  }

  async findByRoom(room: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ room }).exec();
  }

  async getAvailableRooms(
    days: string[],
    startTime: string,
    endTime: string,
    date: Date,
  ): Promise<string[]> {
    // Get all rooms that are in use for the given time slot
    const busySchedules = await this.scheduleModel
      .find({
        days: { $in: days },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
        startDate: { $lte: date },
        endDate: { $gte: date },
      })
      .exec();

    // Get all rooms
    const allRooms = await this.scheduleModel.distinct('room').exec();

    // Filter out busy rooms
    const busyRooms = busySchedules.map((schedule) => schedule.room);
    return allRooms.filter((room) => !busyRooms.includes(room));
  }

  private async checkForConflicts(
    days: string[],
    startTime: string,
    endTime: string,
    room: string,
    startDate: string,
    endDate: string,
  ): Promise<Schedule | null> {
    // Check if there's any schedule that:
    // - has the same room
    // - overlaps in days
    // - overlaps in time
    // - overlaps in date range
    return this.scheduleModel
      .findOne({
        room,
        days: { $in: days },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      })
      .exec();
  }
}
