import { Repository } from 'typeorm';
import { Milestone } from '../database/entities/milestone.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { type UserVerifiedEvent } from '../notifications/notification.events.js';
export declare class MilestonesService {
    private readonly milestones;
    private readonly posts;
    private readonly users;
    constructor(milestones: Repository<Milestone>, posts: Repository<Post>, users: Repository<User>);
    handleUserVerified({ userId }: UserVerifiedEvent): Promise<void>;
    private celebrate;
}
