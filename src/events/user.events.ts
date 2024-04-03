import {
	BasicDataWithCodeAndPeerUserWithSocketId,
	BasicJoinData,
	Code,
	PeerUserWithSocketId,
	SocketType,
} from "../types";
import { io, meetings } from "../index";

export function userConnectionEvents<T extends SocketType>(socket: T): void {
	socket.on("user:join-request", (data) => userJoinRequest(socket, data));
	socket.on("user:accepted", (data) => userAccepted(socket, data));
	socket.on("user:rejected", (data) => userRejected(socket, data));
	socket.on("meeting:join", (data) => userJoin(socket, data));
}

function userJoinRequest(
	socket: SocketType,
	{ code, user, ownerId }: BasicJoinData
): void | boolean {
	if (meetings[code]?.members >= 9) {
		return socket.emit("meeting:full");
	}
	if (user.id === ownerId) {
		if (!meetings[code]) {
			meetings[code] = {
				ownerSocketId: socket.id,
				ownerId: ownerId,
				members: 1,
			};
		} else {
			meetings[code].members = meetings[code].members + 1;
		}
		return socket.emit("user:accepted", { code, user });
	}
	if (!meetings[code]?.ownerId || meetings[code]?.ownerSocketId) {
		return socket.emit("user:wait-for-owner");
	}
	io.to(meetings[code].ownerSocketId).emit("user:join-request", {
		...user,
		socketId: socket.id,
	});
}

function userAccepted(
	_: SocketType,
	{
		code,
		user,
	}: {
		code: Code;
		user: PeerUserWithSocketId;
	}
): void {
	meetings[code].members = meetings[code].members + 1;
	io.to(user.socketId).emit("user:accepted", { code, user });
}

function userRejected(
	_: SocketType,
	{ code, user }: BasicDataWithCodeAndPeerUserWithSocketId
): void {
	io.to(user.socketId).emit("user:rejected", { code, user });
}

function userJoin(
	socket: SocketType,
	{ code, user }: BasicDataWithCodeAndPeerUserWithSocketId
): void {
	socket.join(code);
	socket.to(code).emit("user:join", user);
	socket.on("user:toggle-audio", (userPeerId) => {
		socket.to(code).emit("user:toggled-audio", userPeerId);
	});
	socket.on("user:toggle-video", (userPeerId) => {
		socket.to(code).emit("user:toggled-video", userPeerId);
	});
	socket.on("disconnect", () => {
		if (meetings[code]?.ownerSocketId === socket.id) {
			meetings[code].ownerId = "";
			meetings[code].ownerSocketId = "";
		}
		if (meetings[code]?.members <= 1) {
			delete meetings[code];
		} else {
			meetings[code].members = meetings[code]?.members - 1 || 0;
		}
		socket.to(code).emit("user:left", user.peerId);
	});
}
