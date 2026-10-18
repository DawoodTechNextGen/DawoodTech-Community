declare class PushKeysDto {
    p256dh: string;
    auth: string;
}
export declare class SubscribePushDto {
    endpoint: string;
    keys: PushKeysDto;
}
export declare class UnsubscribePushDto {
    endpoint: string;
}
export {};
