import { ActivityEmailType } from '../database/entities/activity-email-queue.entity.js';
import { commentTargets } from './activity-recipients.js';

describe('commentTargets', () => {
  it('emails the post owner about a top-level comment', () => {
    expect(commentTargets({ postOwnerId: 1, parentCommentAuthorId: null, actorId: 2 }, [])).toEqual(
      [{ userId: 1, type: ActivityEmailType.COMMENT }],
    );
  });

  it('tells an earlier commenter (a1) when someone else (a2) comments on the same post', () => {
    expect(commentTargets({ postOwnerId: 1, parentCommentAuthorId: null, actorId: 3 }, [2])).toEqual(
      [
        { userId: 1, type: ActivityEmailType.COMMENT },
        { userId: 2, type: ActivityEmailType.THREAD_COMMENT },
      ],
    );
  });

  it('sends a reply email to the parent comment author instead of a thread email', () => {
    expect(commentTargets({ postOwnerId: 1, parentCommentAuthorId: 2, actorId: 3 }, [2, 4])).toEqual(
      [
        { userId: 1, type: ActivityEmailType.COMMENT },
        { userId: 2, type: ActivityEmailType.REPLY },
        { userId: 4, type: ActivityEmailType.THREAD_COMMENT },
      ],
    );
  });

  it('never emails the commenter, and emails each person once', () => {
    expect(
      commentTargets({ postOwnerId: 1, parentCommentAuthorId: 1, actorId: 1 }, [1, 2, 2]),
    ).toEqual([{ userId: 2, type: ActivityEmailType.THREAD_COMMENT }]);
  });

  it('treats string ids from the database the same as numbers', () => {
    expect(
      commentTargets(
        { postOwnerId: '1' as unknown as number, parentCommentAuthorId: null, actorId: 2 },
        [1],
      ),
    ).toEqual([{ userId: 1, type: ActivityEmailType.COMMENT }]);
  });
});
