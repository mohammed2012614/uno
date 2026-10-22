# Security Specification for UNO Arena Online

## 1. Data Invariants
- Users can only read and write their own user profile `/users/{userId}` where `userId == request.auth.uid`.
- Custom editions `/users/{userId}/editions/{editionId}` are strictly owned by `request.auth.uid`.
- Game rooms `/rooms/{roomId}`:
  - Can only be created by an authenticated user who becomes the host (`hostId == request.auth.uid`).
  - Read access is allowed to all authenticated users so lobbies can be listed and joined.
  - Updates can be performed by the host or participating players for valid actions (moving turn, status change, drawing cards).
- Player hand `/rooms/{roomId}/hands/{playerId}`:
  - Private data! Only `playerId == request.auth.uid` can read their own cards, preserving card secrecy in multiplayer UNO.
- Room players `/rooms/{roomId}/players/{playerId}`:
  - Public info in room (name, cardCount, ready state). Players can only update their own record or host can manage room seats.

## 2. Dirty Dozen Security Attack Payloads
1. Attempting to write someone else's user profile: `PATCH /users/victim-uid { xp: 99999 }` by `attacker-uid` -> DENIED.
2. Attempting to read another player's private hand: `GET /rooms/room-123/hands/victim-player-id` by `attacker-player-id` -> DENIED.
3. Attempting to create an edition with spoofed ownerId: `POST /users/attacker-uid/editions/ed-1 { ownerId: "admin-uid" }` -> DENIED.
4. Attempting to delete someone else's custom edition: `DELETE /users/victim-uid/editions/ed-1` by `attacker-uid` -> DENIED.
5. Attempting to inject 2MB string in edition title: `POST /users/attacker-uid/editions/ed-1 { title: "...2MB..." }` -> DENIED by length check.
6. Attempting to modify closed game room after finished status: `PATCH /rooms/room-123 { status: "playing" }` when status is already finished -> DENIED.
7. Attempting to forge room messages under someone else's identity: `POST /rooms/room-123/messages/msg-1 { senderId: "other-uid" }` -> DENIED.
8. Attempting to write unauthenticated to `/rooms/room-123` -> DENIED.
9. Attempting path traversal or ID poisoning with invalid characters in roomId -> DENIED by `isValidId`.
10. Attempting to overwrite existing user's `createdAt` timestamp during profile updates -> DENIED by immutability check.
11. Attempting to change hostId to steal room ownership -> DENIED.
12. Attempting to post room messages when not in the room -> DENIED.
