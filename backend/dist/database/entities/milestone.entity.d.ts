export declare enum MilestoneKind {
    JOINED = "joined",
    INTERNSHIP_COMPLETED = "internship_completed"
}
export declare class Milestone {
    id: number;
    sourceKey: string;
    kind: MilestoneKind;
    userId: number;
    postId: number | null;
    createdAt: Date;
}
