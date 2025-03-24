import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Room } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// Create a singleton socket instance that persists across component renders
let globalSocket: Socket | null = null;

// Add a global socket status tracker
export const globalSocketStatus = {
	connected: false
};

export interface ActiveRoom {
	id: string;
	name: string;
	userCount: number;
}

export const useSocket = (onRoomUpdate: (room: Room) => void) => {
	const onRoomUpdateRef = useRef(onRoomUpdate);

	// Update the ref when the callback changes
	useEffect(() => {
		onRoomUpdateRef.current = onRoomUpdate;
	}, [onRoomUpdate]);

	const rejoinRoom = useCallback(() => {
		const savedRoom = localStorage.getItem("room");
		const savedUser = localStorage.getItem("user");
		if (savedRoom && savedUser && globalSocket?.connected) {
			const room = JSON.parse(savedRoom);
			const user = JSON.parse(savedUser);
			console.log("Attempting to rejoin room:", room.id);
			globalSocket.emit("joinRoom", {
				roomId: room.id,
				userName: user.name,
				isSpectator: user.isSpectator,
			});
		}
	}, []);

	useEffect(() => {
		// Only create a socket if it doesn't exist yet
		if (!globalSocket) {
			console.log("Connecting to socket server...");
			globalSocket = io(SOCKET_URL, {
				transports: ["websocket"],
				reconnection: true,
				reconnectionDelay: 1000,
				reconnectionAttempts: 5,
				autoConnect: true,
			});

			globalSocket.on("connect", () => {
				console.log("Socket connected successfully");
				globalSocketStatus.connected = true;
				window.dispatchEvent(new Event('socket_connected'));
				rejoinRoom();
			});

			globalSocket.on("connect_error", (error) => {
				console.error("Socket connection error:", error);
				globalSocketStatus.connected = false;
				window.dispatchEvent(new Event('socket_disconnected'));
			});

			globalSocket.on("disconnect", () => {
				console.log("Socket disconnected");
				globalSocketStatus.connected = false;
				window.dispatchEvent(new Event('socket_disconnected'));
			});

			globalSocket.on("reconnect", () => {
				console.log("Socket reconnected");
				globalSocketStatus.connected = true;
				window.dispatchEvent(new Event('socket_connected'));
				rejoinRoom();
			});
		}

		// Set up event listeners that use the latest callback
		const handleRoomUpdate = (room: Room) => {
			onRoomUpdateRef.current(room);
		};

		globalSocket.on("roomUpdated", handleRoomUpdate);

		globalSocket.on("roomError", (error) => {
			console.error("Room error:", error);
			localStorage.setItem("roomError", JSON.stringify(error));
		});

		// Listen for active rooms updates directly from the server
		globalSocket.on("activeRoomsUpdated", (rooms: ActiveRoom[]) => {
			console.log("Received updated active rooms:", rooms.length);
			// Dispatch a custom event with the updated rooms
			// This updates the active rooms list, including when user counts change
			window.dispatchEvent(new CustomEvent('activeRoomsUpdated', { 
				detail: { type: 'fullUpdate', rooms } 
			}));
		});

		// Clean up event listeners when component unmounts
		return () => {
			globalSocket?.off("roomUpdated", handleRoomUpdate);
			globalSocket?.off("roomError");
			globalSocket?.off("activeRoomsUpdated");
			// Don't disconnect the socket, just remove the listeners
		};
	}, [rejoinRoom]);

	const createRoom = useCallback((roomName: string, userName: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("createRoom", { roomName, userName });
		} else {
			console.error("Socket not connected");
		}
	}, []);

	const joinRoom = useCallback(
		(roomId: string, userName: string, isSpectator: boolean) => {
			if (globalSocket?.connected) {
				globalSocket.emit("joinRoom", { roomId, userName, isSpectator });
			} else {
				console.error("Socket not connected");
			}
		},
		[]
	);

	const getActiveRooms = useCallback(() => {
		return new Promise<ActiveRoom[]>((resolve) => {
			if (globalSocket?.connected) {
				// Just request rooms once without setting up a listener
				globalSocket.emit("getActiveRooms");
				
				// Set up a one-time listener for the response
				globalSocket.once("activeRooms", (rooms: ActiveRoom[]) => {
					console.log("Initial active rooms fetch:", rooms.length);
					resolve(rooms);
				});
				
				// Add a timeout to prevent hanging if the server doesn't respond
				setTimeout(() => {
					console.warn("Timed out waiting for active rooms");
					resolve([]);
				}, 5000);
			} else {
				console.error("Socket not connected");
				resolve([]);
			}
		});
	}, []);

	const vote = useCallback((roomId: string, value: number | null) => {
		if (globalSocket?.connected) {
			globalSocket.emit("vote", { roomId, value });
		}
	}, []);

	const revealVotes = useCallback((roomId: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("revealVotes", roomId);
		}
	}, []);

	const resetVotes = useCallback((roomId: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("resetVotes", roomId);
		}
	}, []);

	const setCurrentStory = useCallback((roomId: string, story: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("setCurrentStory", { roomId, story });
		}
	}, []);

	const toggleSpectator = useCallback((roomId: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("toggleSpectator", { roomId });
		}
	}, []);

	const leaveRoom = useCallback((roomId: string) => {
		if (globalSocket?.connected) {
			globalSocket.emit("leaveRoom", { roomId });
		}
	}, []);

	return {
		createRoom,
		joinRoom,
		vote,
		revealVotes,
		resetVotes,
		setCurrentStory,
		toggleSpectator,
		leaveRoom,
		getActiveRooms,
	};
};
