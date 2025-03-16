import { useState, useRef } from "react";
import {
	Box,
	Button,
	Grid,
	Heading,
	Input,
	Text,
	VStack,
	HStack,
	useToast,
	Tooltip,
} from "@chakra-ui/react";
import { PointingCard } from "./PointingCard";
import { useRoom } from "../context/RoomContext";
import { PointValue } from "../types";

const POINT_VALUES: PointValue[] = [0, 1, 2, 3, 5, 8, 13, 21, "?", "coffee"];

export const Room: React.FC = () => {
	const {
		room,
		user,
		vote,
		revealVotes,
		resetVotes,
		setCurrentStory,
		exitRoom,
	} = useRoom();
	const [story, setStory] = useState("");
	const [showCopied, setShowCopied] = useState(false);
	const toast = useToast();

	if (!room || !user) {
		return <Text>Loading...</Text>;
	}

	const handleCopyRoomId = () => {
		navigator.clipboard.writeText(room.id);
		setShowCopied(true);
		setTimeout(() => setShowCopied(false), 2000);
		toast({
			title: "Room ID copied!",
			description: "You can share this with others to join the room",
			status: "success",
			duration: 2000,
			isClosable: true,
		});
	};

	const handleVote = (value: PointValue) => {
		vote(value);
		toast({
			title: "Vote submitted",
			status: "success",
			duration: 2000,
			isClosable: true,
		});
	};

	const handleStorySubmit = () => {
		if (!story.trim()) {
			toast({
				title: "Please enter a story",
				status: "error",
				duration: 2000,
				isClosable: true,
			});
			return;
		}
		setCurrentStory(story);
		setStory("");
		resetVotes();
	};

	const calculateAverage = () => {
		let sum = 0;
		let count = 0;
		
		// Use a simple loop to avoid type issues
		for (const vote of room.votes) {
			if (typeof vote.value === 'number') {
				sum += vote.value;
				count++;
			}
		}
		
		if (count === 0) return 0;
		return Math.round((sum / count) * 10) / 10;
	};

	return (
		<Box p={8}>
			<VStack spacing={6} alignItems="stretch">
				<HStack justifyContent="space-between" alignItems="center">
					<VStack alignItems="flex-start" spacing={0}>
						<Text color="gray.600">Hello, {user.name}</Text>
						<Heading>{room.name}</Heading>
					</VStack>
					<HStack>
						<Tooltip label="Copied!" isOpen={showCopied}>
							<Button colorScheme="blue" onClick={handleCopyRoomId}>
								Copy Room ID
							</Button>
						</Tooltip>
						<Button colorScheme="red" onClick={exitRoom}>
							Exit Room
						</Button>
					</HStack>
				</HStack>

				{!user.isSpectator && (
					<HStack>
						<Input
							placeholder="Enter story or task description"
							value={story}
							onChange={(e) => setStory(e.target.value)}
						/>
						<Button colorScheme="blue" onClick={handleStorySubmit}>
							Set Story
						</Button>
					</HStack>
				)}

				{room.currentStory && (
					<Box p={4} bg="gray.100" borderRadius="md">
						<Text fontWeight="bold">Current Story:</Text>
						<Text>{room.currentStory}</Text>
					</Box>
				)}

				{!user.isSpectator && (
					<Grid templateColumns="repeat(auto-fit, minmax(70px, 1fr))" gap={4}>
						{POINT_VALUES.map((value) => (
							<PointingCard
								key={value}
								value={value}
								isSelected={room.votes.some(
									(v) => v.userId === user.id && v.value === value
								)}
								onClick={() => handleVote(value)}
								isRevealed={room.isRevealed}
							/>
						))}
					</Grid>
				)}

				<Box>
					<Text fontWeight="bold">Participants:</Text>
					{room.users
						.filter(u => !u.isSpectator)
						.map((u) => (
							<Text key={u.id}>
								{u.name} {room.votes.some((v) => v.userId === u.id) ? " ✓" : ""}
							</Text>
						))}
					
					{room.users.some(u => u.isSpectator) && (
						<>
							<Text fontWeight="bold" mt={2}>Spectators:</Text>
							{room.users
								.filter(u => u.isSpectator)
								.map((u) => (
									<Text key={u.id}>{u.name}</Text>
								))}
						</>
					)}
				</Box>

				{room.isRevealed && (
					<Box>
						<Text fontWeight="bold">Results:</Text>
						<Text>Average: {calculateAverage()}</Text>
						{room.votes.map((vote) => {
							const voter = room.users.find((u) => u.id === vote.userId);
							return (
								<Text key={vote.userId}>
									{voter?.name}: {vote.value ?? "No vote"}
								</Text>
							);
						})}
					</Box>
				)}

				<HStack>
					<Button
						colorScheme="green"
						onClick={revealVotes}
						isDisabled={room.votes.length === 0 || room.isRevealed}
					>
						Reveal Votes
					</Button>
					<Button
						colorScheme="red"
						onClick={resetVotes}
						isDisabled={room.votes.length === 0}
					>
						Reset Votes
					</Button>
				</HStack>
			</VStack>
		</Box>
	);
};
