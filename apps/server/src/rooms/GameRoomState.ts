import { ArraySchema, Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("uint8") seat = 0;
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") z = 0;
  @type("uint16") hp = 100;
  @type("boolean") isAlive = true;
  @type("boolean") connected = true;
  @type("boolean") hasValidated = false;
}

export class GameRoomState extends Schema {
  @type("string")
  status: "WAITING" | "SELECTING" | "RESOLVING" | "FINISHED" | "CANCELLED" = "WAITING";

  @type("uint8") turnNumber = 0;
  @type("number") turnDeadlineAt = 0;
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>();
}
