import { users, rooms, roomMembers, messages, type DbUser, type DbRoom, type DbMessage } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  createUser(userData: { phone: string; email?: string; first_name?: string; last_name?: string }): Promise<DbUser>;
  getUserById(id: number): Promise<DbUser | undefined>;
  
  // Room operations
  createRoom(name?: string): Promise<DbRoom>;
  addUserToRoom(roomId: number, userId: number): Promise<void>;
  getUserRooms(userId: number): Promise<Array<DbRoom & { members: DbUser[] }>>;
  
  // Message operations
  createMessage(roomId: number, userId: number, text: string): Promise<DbMessage>;
  getRoomMessages(roomId: number): Promise<Array<DbMessage & { user: DbUser }>>;
}

export class DatabaseStorage implements IStorage {
  async createUser(userData: { phone: string; email?: string; first_name?: string; last_name?: string }): Promise<DbUser> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<DbUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createRoom(name?: string): Promise<DbRoom> {
    const [room] = await db
      .insert(rooms)
      .values({ name })
      .returning();
    return room;
  }

  async addUserToRoom(roomId: number, userId: number): Promise<void> {
    await db
      .insert(roomMembers)
      .values({ room_id: roomId, user_id: userId })
      .onConflictDoNothing();
  }

  async getUserRooms(userId: number): Promise<Array<DbRoom & { members: DbUser[] }>> {
    // Get all rooms the user is a member of
    const userRoomsQuery = await db
      .select({
        room: rooms,
        member: users,
      })
      .from(roomMembers)
      .innerJoin(rooms, eq(roomMembers.room_id, rooms.id))
      .innerJoin(users, eq(roomMembers.user_id, users.id))
      .where(eq(roomMembers.room_id, db
        .select({ id: rooms.id })
        .from(rooms)
        .innerJoin(roomMembers, eq(rooms.id, roomMembers.room_id))
        .where(eq(roomMembers.user_id, userId))
      ));

    // Group by room
    const roomMap = new Map<number, DbRoom & { members: DbUser[] }>();
    
    userRoomsQuery.forEach(({ room, member }) => {
      if (!roomMap.has(room.id)) {
        roomMap.set(room.id, { ...room, members: [] });
      }
      roomMap.get(room.id)!.members.push(member);
    });

    return Array.from(roomMap.values());
  }

  async createMessage(roomId: number, userId: number, text: string): Promise<DbMessage> {
    const [message] = await db
      .insert(messages)
      .values({ room_id: roomId, user_id: userId, text })
      .returning();
    return message;
  }

  async getRoomMessages(roomId: number): Promise<Array<DbMessage & { user: DbUser }>> {
    const messagesWithUsers = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.user_id, users.id))
      .where(eq(messages.room_id, roomId))
      .orderBy(desc(messages.created_at));

    return messagesWithUsers.map(({ message, user }) => ({ ...message, user }));
  }
}

export const storage = new DatabaseStorage();