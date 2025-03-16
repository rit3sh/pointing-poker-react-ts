import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { Room, RoomContextType, User, PointValue } from "../types";
import { useSocket, ActiveRoom } from "../hooks/useSocket";

const RoomContext = createContext<RoomContextType | null>(null);

const useRoom = () => {
	const context = useContext(RoomContext);
	if (!context) {
		throw new Error("useRoom must be used within a RoomProvider");
	}
	return context;
};

const RoomProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [room, setRoom] = useState<Room | null>(() => {
		const savedRoom = localStorage.getItem("room");
		return savedRoom ? JSON.parse(savedRoom) : null;
	});
	
	const [user, setUser] = useState<User | null>(() => {
		const savedUser = localStorage.getItem("user");
		return savedUser ? JSON.parse(savedUser) : null;
	});
	
	const [pendingUserName, setPendingUserName] = useState<string | null>(null);

	const handleRoomUpdate = useCallback((updatedRoom: Room) => {
		console.log("Handling room update:", updatedRoom);
		
		// Reset any loading states that might be in localStorage
		localStorage.removeItem('isJoining');
		localStorage.removeItem('isCreating');
		
		// If we're waiting for a user to be created
		if (pendingUserName) {
			const currentUser = updatedRoom.users.find((u) => u.name === pendingUserName);
			if (currentUser) {
				console.log("Setting user:", currentUser);
				setUser(currentUser);
				setPendingUserName(null);
			}
		} else if (user) {
			// If we have a saved user in the room, update their info
			const currentUser = updatedRoom.users.find((u) => u.id === user.id || u.name === user.name);
			if (currentUser) {
				setUser(currentUser);
			} else {
				// If our user is no longer in the room, clear the saved data
				setUser(null);
				setRoom(null);
				localStorage.removeItem('user');
				localStorage.removeItem('room');
				return;
			}
		}

		// Update the room state
		setRoom(updatedRoom);
	}, [user, pendingUserName]);

	const socket = useSocket(handleRoomUpdate);

	// Save room and user to localStorage whenever they change
	useEffect(() => {
		if (room) {
			localStorage.setItem("room", JSON.stringify(room));
		} else {
			localStorage.removeItem("room");
		}
	}, [room]);

	useEffect(() => {
		if (user) {
			localStorage.setItem("user", JSON.stringify(user));
		} else {
			localStorage.removeItem("user");
		}
	}, [user]);

	const createRoom = useCallback((roomName: string, userName: string) => {
		console.log("Creating room:", { roomName, userName });
		setPendingUserName(userName);
		socket.createRoom(roomName, userName);
	}, [socket]);

	const joinRoom = useCallback((roomId: string, userName: string, isSpectator: boolean) => {
		console.log("Joining room:", { roomId, userName, isSpectator });
		setPendingUserName(userName);
		socket.joinRoom(roomId, userName, isSpectator);
	}, [socket]);

	const vote = useCallback((value: PointValue) => {
		if (!room || !user) return;
		socket.vote(room.id, typeof value === "number" ? value : null);
	}, [room, user, socket]);

	const revealVotes = useCallback(() => {
		if (!room) return;
		socket.revealVotes(room.id);
	}, [room, socket]);

	const resetVotes = useCallback(() => {
		if (!room) return;
		socket.resetVotes(room.id);
	}, [room, socket]);

	const setCurrentStory = useCallback((story: string) => {
		if (!room) return;
		socket.setCurrentStory(room.id, story);
	}, [room, socket]);

	const exitRoom = useCallback(() => {
		if (room) {
			socket.leaveRoom(room.id);
		}
		setRoom(null);
		setUser(null);
		setPendingUserName(null);
		localStorage.removeItem('room');
		localStorage.removeItem('user');
	}, [room, socket]);

	const getActiveRooms = useCallback(() => {
		return socket.getActiveRooms();
	}, [socket]);

	return (
		<RoomContext.Provider
			value={{
				room,
				user,
				joinRoom,
				createRoom,
				vote,
				revealVotes,
				resetVotes,
				setCurrentStory,
				exitRoom,
				getActiveRooms,
			}}
		>
			{children}
		</RoomContext.Provider>
	);
};

export { RoomProvider, useRoom };
