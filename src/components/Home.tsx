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
import { AddIcon, MoonIcon, PlusSquareIcon, SunIcon } from "@chakra-ui/icons";
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

	// Check socket connection status
	useEffect(() => {
		const checkSocketStatus = () => {
			setSocketConnected(globalSocketStatus.connected);
		};

		// Check initially
		checkSocketStatus();

		// Set up listeners
		window.addEventListener("socket_connected", checkSocketStatus);
		window.addEventListener("socket_disconnected", checkSocketStatus);

		return () => {
			window.removeEventListener("socket_connected", checkSocketStatus);
			window.removeEventListener("socket_disconnected", checkSocketStatus);
		};
	}, []);

	// Fetch active rooms when component mounts or socket reconnects
	useEffect(() => {
		const fetchRooms = async () => {
			setIsLoadingRooms(true);
			try {
				const rooms = await getActiveRooms();
				setActiveRooms(rooms);
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

			if (type === "fullUpdate" && Array.isArray(rooms)) {
				console.log("Updating active rooms list:", rooms.length);

				// Check if we already have rooms and are just updating user counts
				if (activeRooms.length > 0 && rooms.length === activeRooms.length) {
					// Look for user count changes
					const changedRooms = rooms.filter((newRoom) => {
						const oldRoom = activeRooms.find((r) => r.id === newRoom.id);
						return oldRoom && oldRoom.userCount !== newRoom.userCount;
					});

					if (changedRooms.length > 0) {
						console.log(
							"Room user counts updated:",
							changedRooms
								.map((r) => `${r.name}: ${r.userCount} users`)
								.join(", ")
						);
					}
				}

				setActiveRooms(rooms);
			}
		};

		window.addEventListener(
			"activeRoomsUpdated",
			handleActiveRoomsUpdate as EventListener
		);

		return () => {
			window.removeEventListener(
				"activeRoomsUpdated",
				handleActiveRoomsUpdate as EventListener
			);
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
		const roomExists = activeRooms.some((room) => room.id === roomId);
		if (!roomExists) {
			toast({
				title: "Invalid Room ID",
				description:
					"The room you're trying to join doesn't exist or has been closed.",
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
					<Heading size="lg">Planning Poker</Heading>
					<Button
						colorScheme={colorMode === "light" ? "white" : "gray.700"}
						bgColor={colorMode === "light" ? "gray.700" : "gray.100"}
						onClick={toggleColorMode}
						leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
						shadow="md"
						size="sm"
					>
						{colorMode === "light" ? "Dark" : "Light"}
					</Button>
				</HStack>

				<ChakraFormControl isRequired>
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
						leftIcon={<AddIcon />}
					>
						Create Room
					</Button>
				</ChakraFormControl>

				<ChakraFormControl>
					<ChakraFormLabel>Join Existing Room</ChakraFormLabel>

					<HStack mb={2} alignItems="center">
						{isLoadingRooms && <Spinner size="sm" />}
					</HStack>

					{activeRooms.length > 0 ? (
						<>
							<Select
								placeholder="Select a room"
								value={roomId}
								onChange={handleRoomSelect}
								mb={2}
							>
								{activeRooms.map((room) => (
									<option key={room.id} value={room.id}>
										{room.name} (ID: {room.id.substring(0, 8)}...) -{" "}
										{room.userCount} user(s)
									</option>
								))}
							</Select>

							<Input
								value={roomId}
								onChange={(e) => setRoomId(e.target.value)}
								placeholder="Or enter room ID manually"
								mb={2}
							/>
						</>
					) : (
						<Text mb={2} fontSize="sm" color="gray.500">
							{isLoadingRooms
								? "Loading rooms..."
								: "No active rooms found. Create one!"}
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
						leftIcon={<PlusSquareIcon />}
					>
						Join Room
					</Button>
				</ChakraFormControl>
			</VStack>
		</Box>
	);
};
