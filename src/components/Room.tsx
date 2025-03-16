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
	useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { PointingCard } from "./PointingCard";
import { useRoom } from "../context/RoomContext";
import { PointValue } from "../types";

const POINT_VALUES: PointValue[] = [0, 1, 2, 3, 5, 8, 13, 21, "?"];

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
	const toast = useToast();
	const { colorMode, toggleColorMode } = useColorMode();

	if (!room || !user) {
		return <Text>Loading...</Text>;
	}

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
			if (typeof vote.value === "number") {
				sum += vote.value;
				count++;
			}
		}

		if (count === 0) return 0;
		return Math.round((sum / count) * 10) / 10;
	};

	return (
		<>
			<Box w="60%" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
				<VStack spacing={6} alignItems="stretch">
					<HStack justifyContent="space-between" alignItems="center">
						<VStack alignItems="flex-start" spacing={0}>
							<Text fontSize="sm" color="gray.600">
								Hello, {user.name}
							</Text>
							<Heading>{room.name}</Heading>
						</VStack>
						<HStack>
							<Button
								colorScheme={colorMode === "light" ? "gray" : "blue"}
								onClick={toggleColorMode}
								leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
							>
								{colorMode === "light" ? "Dark" : "Light"}
							</Button>
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
						<Box p={4} bg={colorMode === "light" ? "gray.100" : "blackAlpha.400"} borderRadius="md">
							<Text fontWeight="bold">Current Story:</Text>
							<Text>{room.currentStory}</Text>
						</Box>
					)}

					{!user.isSpectator && (
						<>
							{!room.currentStory && (
								<Box p={4} bg="yellow.50" borderRadius="md" mb={4}>
									<Text color="yellow.700">
										Please set a story before voting.
									</Text>
								</Box>
							)}
							<Grid templateColumns="repeat(auto-fit, minmax(70px, 1fr))" gap={4}>
								{POINT_VALUES.map((value) => (
									<PointingCard
										key={value}
										value={value}
										isSelected={room.votes.some(
											(v) => v.userId === user.id && v.value === value
										)}
										onClick={!room.currentStory ? undefined : () => handleVote(value)}
										isRevealed={room.isRevealed}
										isDisabled={!room.currentStory}
									/>
								))}
							</Grid>
						</>
					)}

					<Box>
						<Text fontWeight="bold">Participants:</Text>
						{room.users
							.filter((u) => !u.isSpectator)
							.map((u) => (
								<Text key={u.id}>
									{u.name}{" "}
									{room.votes.some((v) => v.userId === u.id) ? " ✓" : ""}
								</Text>
							))}

						{room.users.some((u) => u.isSpectator) && (
							<>
								<Text fontWeight="bold" mt={2}>
									Spectators:
								</Text>
								{room.users
									.filter((u) => u.isSpectator)
									.map((u) => (
										<Text key={u.id}>{u.name}</Text>
									))}
							</>
						)}
					</Box>

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

			{room.isRevealed && (
				<Box w="60%" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
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
		</>
	);
};
