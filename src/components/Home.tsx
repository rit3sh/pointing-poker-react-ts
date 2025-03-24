import React, { useState, useEffect } from "react";
import {
	Box,
	Button,
	FormControl as ChakraFormControl,
	FormLabel as ChakraFormLabel,
	Input,
	VStack,
	Heading,
	useToast,
	Select,
	Text,
	HStack,
	Spinner,
	useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useRoom } from "../context/RoomContext";
import { ActiveRoom } from "../hooks/useSocket";
import { globalSocketStatus } from "../hooks/useSocket";

export const Home: React.FC = () => {
	const [userName, setUserName] = useState("");
	const [roomName, setRoomName] = useState("");
	const [roomId, setRoomId] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [socketConnected, setSocketConnected] = useState(false);
	const { createRoom, joinRoom, room, getActiveRooms } = useRoom();
	const toast = useToast();
	const { colorMode, toggleColorMode } = useColorMode();

	// Check for roomId in URL immediately on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const roomIdParam = urlParams.get('roomId');
		if (roomIdParam) {
			setRoomId(roomIdParam);
			// Focus on the join button
			setTimeout(() => {
				const joinButton = document.querySelector('button[data-join-button]');
				if (joinButton) {
					(joinButton as HTMLButtonElement).focus();
				}
			}, 100);
		}
	}, []);

	// Update roomId when URL changes
	useEffect(() => {
		const handleUrlChange = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const roomIdParam = urlParams.get('roomId');
			if (roomIdParam) {
				setRoomId(roomIdParam);
			}
		};

		window.addEventListener('popstate', handleUrlChange);
		return () => window.removeEventListener('popstate', handleUrlChange);
	}, []);

	// Check socket connection status
	useEffect(() => {
		const checkSocketStatus = () => {
			setSocketConnected(globalSocketStatus.connected);
		};
		
		// Check initially
		checkSocketStatus();
		
		// Set up listeners
		window.addEventListener('socket_connected', checkSocketStatus);
		window.addEventListener('socket_disconnected', checkSocketStatus);
		
		return () => {
			window.removeEventListener('socket_connected', checkSocketStatus);
			window.removeEventListener('socket_disconnected', checkSocketStatus);
		};
	}, []);

	// Fetch active rooms when component mounts or socket reconnects
	useEffect(() => {
		const fetchRooms = async () => {
			setIsLoadingRooms(true);
			try {
				const rooms = await getActiveRooms();
				setActiveRooms(rooms);

				// Check if current roomId exists in active rooms
				const urlParams = new URLSearchParams(window.location.search);
				const roomIdParam = urlParams.get('roomId');
				if (roomIdParam) {
					const roomExists = rooms.some(room => room.id === roomIdParam);
					if (!roomExists) {
						// Room doesn't exist, clear the URL and roomId
						const url = new URL(window.location.href);
						url.searchParams.delete('roomId');
						window.history.replaceState({}, '', url.toString());
						setRoomId("");
					}
				}
			} catch (error) {
				console.error("Error fetching rooms:", error);
				toast({
					title: "Error fetching rooms",
					status: "error",
					duration: 3000,
					isClosable: true,
				});
			} finally {
				setIsLoadingRooms(false);
			}
		};

		// Initially fetch rooms when component mounts
		fetchRooms();
		
		// Listen for active rooms updates from the server
		const handleActiveRoomsUpdate = (event: CustomEvent) => {
			const { type, rooms } = event.detail;
			
			if (type === 'fullUpdate' && Array.isArray(rooms)) {
				console.log("Updating active rooms list:", rooms.length);
				
				// Check if we already have rooms and are just updating user counts
				if (activeRooms.length > 0 && rooms.length === activeRooms.length) {
					// Look for user count changes
					const changedRooms = rooms.filter(newRoom => {
						const oldRoom = activeRooms.find(r => r.id === newRoom.id);
						return oldRoom && oldRoom.userCount !== newRoom.userCount;
					});
					
					if (changedRooms.length > 0) {
						console.log("Room user counts updated:", 
							changedRooms.map(r => `${r.name}: ${r.userCount} users`).join(", "));
					}
				}
				
				setActiveRooms(rooms);
				
				// Check if current roomId exists in updated rooms
				const urlParams = new URLSearchParams(window.location.search);
				const roomIdParam = urlParams.get('roomId');
				if (roomIdParam) {
					const roomExists = rooms.some(room => room.id === roomIdParam);
					if (!roomExists) {
						// Room doesn't exist, clear the URL and roomId
						const url = new URL(window.location.href);
						url.searchParams.delete('roomId');
						window.history.replaceState({}, '', url.toString());
						setRoomId("");
					}
				}
			}
		};

		window.addEventListener('activeRoomsUpdated', handleActiveRoomsUpdate as EventListener);
		
		return () => {
			window.removeEventListener('activeRoomsUpdated', handleActiveRoomsUpdate as EventListener);
		};
	}, [getActiveRooms, toast, socketConnected]);

	// Reset loading states when room changes
	useEffect(() => {
		if (room) {
			setIsJoining(false);
			setIsCreating(false);
		}
	}, [room]);

	// Clear roomId when there are no active rooms
	useEffect(() => {
		if (activeRooms.length === 0 && !isLoadingRooms) {
			setRoomId("");
		}
	}, [activeRooms, isLoadingRooms]);

	// Check for room errors in localStorage
	useEffect(() => {
		const roomError = localStorage.getItem("roomError");
		if (roomError) {
			const error = JSON.parse(roomError);
			toast({
				title: "Error joining room",
				description: error.message,
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			localStorage.removeItem("roomError");
			setIsJoining(false);
			setIsCreating(false);
		}
	}, [toast]);

	const handleCreateRoom = () => {
		if (!userName.trim() || !roomName.trim()) {
			toast({
				title: "Please fill in all fields",
				status: "error",
				duration: 2000,
				isClosable: true,
			});
			return;
		}
		setIsCreating(true);
		createRoom(roomName, userName);
		// Room state change will reset loading state
	};

	const handleJoinRoom = () => {
		if (!userName.trim() || !roomId.trim()) {
			toast({
				title: "Please fill in all fields",
				status: "error",
				duration: 2000,
				isClosable: true,
			});
			return;
		}

		// Check if room exists in active rooms
		const roomExists = activeRooms.some(room => room.id === roomId);
		if (!roomExists) {
			toast({
				title: "Invalid Room ID",
				description: "The room you're trying to join doesn't exist or has been closed.",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		setIsJoining(true);
		joinRoom(roomId, userName, false); // Always join as participant
		// Room state change will reset loading state
	};

	const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setRoomId(e.target.value);
	};

	return (
		<Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
			<VStack spacing={6} alignItems="stretch">
				<HStack justifyContent="space-between">
					<Heading size="lg">
						Planning Poker
					</Heading>
					<Button 
						size="sm" 
						onClick={toggleColorMode}
						leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
						shadow="md"
					>
						{colorMode === "light" ? "Dark" : "Light"}
					</Button>
				</HStack>

				<ChakraFormControl>
					<ChakraFormLabel>Your Name</ChakraFormLabel>
					<Input
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						placeholder="Enter your name"
					/>
				</ChakraFormControl>

				<ChakraFormControl>
					<ChakraFormLabel>Create New Room</ChakraFormLabel>
					<Input
						value={roomName}
						onChange={(e) => setRoomName(e.target.value)}
						placeholder="Enter room name"
					/>
					<Button
						mt={2}
						colorScheme="blue"
						onClick={handleCreateRoom}
						width="full"
						isLoading={isCreating}
						loadingText="Creating..."
						shadow="md"
					>
						Create Room
					</Button>
				</ChakraFormControl>

				<ChakraFormControl>
					<ChakraFormLabel>Join Existing Room</ChakraFormLabel>
					
					<HStack mb={2} alignItems="center">
						<Text>Active Rooms:</Text>
						{isLoadingRooms && <Spinner size="sm" />}
					</HStack>
					
					{activeRooms.length > 0 ? (
						<Select 
							placeholder="Select a room" 
							value={roomId}
							onChange={handleRoomSelect}
							mb={2}
						>
							{activeRooms.map((room) => (
								<option key={room.id} value={room.id}>
									{room.name} (ID: {room.id.substring(0, 8)}...) - {room.userCount} user(s)
								</option>
							))}
						</Select>
					) : (
						<Text mb={2} fontSize="sm" color="gray.500">
							{isLoadingRooms ? "Loading rooms..." : "No active rooms found. Create one!"}
						</Text>
					)}
					
					<Button
						mt={2}
						colorScheme="green"
						onClick={handleJoinRoom}
						width="full"
						isLoading={isJoining}
						loadingText="Joining..."
						isDisabled={!roomId.trim()}
						data-join-button
						shadow="md"
					>
						Join Room
					</Button>
				</ChakraFormControl>
			</VStack>
		</Box>
	);
};
