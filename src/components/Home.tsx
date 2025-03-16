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
	Switch as ChakraSwitch,
	Select,
	Text,
	HStack,
	Spinner,
} from "@chakra-ui/react";
import { useRoom } from "../context/RoomContext";
import { ActiveRoom } from "../hooks/useSocket";

export const Home: React.FC = () => {
	const [userName, setUserName] = useState("");
	const [roomName, setRoomName] = useState("");
	const [roomId, setRoomId] = useState("");
	const [isSpectator, setIsSpectator] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const { createRoom, joinRoom, room, getActiveRooms } = useRoom();
	const toast = useToast();

	// Fetch active rooms when component mounts
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

		fetchRooms();
		
		// Refresh rooms every 5 seconds
		const interval = setInterval(fetchRooms, 5000);
		
		return () => clearInterval(interval);
	}, [getActiveRooms, toast]);

	// Reset loading states when room changes
	useEffect(() => {
		if (room) {
			setIsJoining(false);
			setIsCreating(false);
		}
	}, [room]);

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
		setIsJoining(true);
		joinRoom(roomId, userName, isSpectator);
		// Room state change will reset loading state
	};

	const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setRoomId(e.target.value);
	};

	return (
		<Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
			<VStack spacing={6} alignItems="stretch">
				<Heading size="lg" textAlign="center">
					Planning Poker
				</Heading>

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
					
					<Input
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
						placeholder="Or enter room ID manually"
						mb={2}
					/>
					
					<ChakraFormControl display="flex" alignItems="center" mt={2}>
						<ChakraFormLabel mb="0">Join as Spectator</ChakraFormLabel>
						<ChakraSwitch
							isChecked={isSpectator}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setIsSpectator(e.target.checked)
							}
						/>
					</ChakraFormControl>
					<Button
						mt={2}
						colorScheme="green"
						onClick={handleJoinRoom}
						width="full"
						isLoading={isJoining}
						loadingText="Joining..."
						isDisabled={!roomId.trim()}
					>
						Join Room
					</Button>
				</ChakraFormControl>
			</VStack>
		</Box>
	);
};
