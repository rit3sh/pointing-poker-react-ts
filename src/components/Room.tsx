import { useState } from "react";
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
	useColorMode,
	Spacer,
	Flex,
	Alert,
	AlertIcon,
} from "@chakra-ui/react";
import {
	MoonIcon,
	SunIcon,
	InfoIcon,
	CopyIcon,
	ArrowUpDownIcon,
	ExternalLinkIcon,
	RepeatIcon,
	ViewIcon,
	CheckCircleIcon,
} from "@chakra-ui/icons";
import { PointingCard } from "./PointingCard";
import { useRoom } from "../context/RoomContext";
import { PointValue } from "../types";

const POINT_VALUES: PointValue[] = [1, 2, 3, 5, 8, 13, 20, "?"];

export const Room: React.FC = () => {
	const {
		room,
		user,
		vote,
		revealVotes,
		resetVotes,
		setCurrentStory,
		exitRoom,
		toggleSpectator,
	} = useRoom();
	const [story, setStory] = useState("");
	const toast = useToast();
	const { colorMode, toggleColorMode } = useColorMode();

	if (!room || !user) {
		return <Text>Loading...</Text>;
	}

	const handleExitRoom = () => {
		// Call the exitRoom function from context
		exitRoom();
	};

	const handleToggleSpectator = () => {
		toggleSpectator();
		toast({
			title: user.isSpectator
				? "Switched to participant mode"
				: "Switched to spectator mode",
			description: user.isSpectator
				? "You can now vote on stories"
				: "Your votes have been cleared",
			status: "info",
			duration: 3000,
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
			<Box
				w={{ base: "90%", md: "60%" }}
				mx="auto"
				mt={8}
				p={6}
				borderWidth={1}
				borderRadius="lg"
			>
				<VStack spacing={6} alignItems="stretch">
					<HStack justifyContent="space-between" alignItems="center">
						<Heading>{room.name}</Heading>
						<Spacer />
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
						<Button
							colorScheme={user.isSpectator ? "blue" : "green"}
							onClick={handleToggleSpectator}
							shadow="md"
							size="sm"
							leftIcon={<ArrowUpDownIcon />}
						>
							{user.isSpectator
								? "Switch To Participant"
								: "Switch To Spectator"}
						</Button>
						<Button
							colorScheme="red"
							onClick={handleExitRoom}
							shadow="md"
							size="sm"
							leftIcon={<ExternalLinkIcon />}
						>
							Exit
						</Button>
					</HStack>
					<HStack justifyContent="space-between" alignItems="center">
						<VStack alignItems="flex-start" spacing={0}>
							<Text>Hello, {user.name}!</Text>
						</VStack>
					</HStack>

					{!user.isSpectator && (
						<HStack>
							<Input
								placeholder="Enter story or task description"
								value={story}
								onChange={(e) => setStory(e.target.value)}
							/>
							<Button
								colorScheme="blue"
								onClick={handleStorySubmit}
								shadow="md"
								leftIcon={<CheckCircleIcon />}
							>
								Set Story
							</Button>
						</HStack>
					)}

					{room.currentStory && (
						<Box
							p={4}
							bg={colorMode === "light" ? "gray.100" : "blackAlpha.400"}
							borderRadius="md"
						>
							<Text fontWeight="bold">Current Story:</Text>
							<Text>{room.currentStory}</Text>
						</Box>
					)}

					{!user.isSpectator && (
						<>
							{!room.currentStory && (
								<Alert status="info">
									<AlertIcon />
									Please set a story to enable voting.
								</Alert>
							)}
							<Grid
								templateColumns={{
									base: "repeat(4, 1fr)",
									md: "repeat(8, 1fr)",
								}}
								gap={0}
								mx={-6}
								px={0}
								width="calc(100% + 48px)"
								justifyContent="space-between"
								overflow="hidden"
							>
								{POINT_VALUES.map((value) => (
									<Box
										key={value}
										display="flex"
										justifyContent="center"
										py={4}
									>
										<PointingCard
											value={value}
											isSelected={room.votes.some(
												(v) => v.userId === user.id && v.value === value
											)}
											onClick={
												!room.currentStory ? undefined : () => handleVote(value)
											}
											isRevealed={room.isRevealed}
											isDisabled={!room.currentStory}
										/>
									</Box>
								))}
							</Grid>
						</>
					)}

					{/* Participants and Spectators area */}
					<Flex
						width="100%"
						gap={4}
						flexDirection={{ base: "column", md: "row" }}
					>
						{/* Participants section - 70% width on medium screens and above */}
						<Box
							p={4}
							bg={colorMode === "light" ? "gray.50" : "gray.700"}
							borderRadius="md"
							borderWidth="1px"
							borderColor={colorMode === "light" ? "gray.200" : "gray.600"}
							width={{ base: "100%", md: "70%" }}
						>
							<Grid templateColumns="1fr 120px" gap={2} mb={3} px={2}>
								<Text fontWeight="bold">Name</Text>
								<Text fontWeight="bold" textAlign="center">
									Vote
								</Text>
							</Grid>

							<VStack spacing={2} align="stretch">
								{/* Active Participants */}
								{room.users
									.filter((participant) => !participant.isSpectator)
									.sort((a, b) => a.name.localeCompare(b.name))
									.map((participant) => (
										<Grid
											key={participant.id}
											templateColumns="1fr 120px"
											gap={2}
											p={2}
											borderRadius="md"
										>
											<Flex align="center">
												<Text
													fontWeight={
														participant.id === user.id ? "bold" : "normal"
													}
												>
													{participant.name}{" "}
													{participant.id === user.id && "(you)"}
												</Text>
											</Flex>
											<Flex justify="center" align="center" minHeight="40px">
												{!room.votes.find(
													(vote) => vote.userId === participant.id
												) ? (
													<Box
														p={2}
														bg={colorMode === "light" ? "gray.100" : "gray.600"}
														borderRadius="md"
														textAlign="center"
														minWidth="80px"
														display="flex"
														justifyContent="center"
														alignItems="center"
														height="40px"
													>
														<Text
															fontSize="sm"
															color={
																colorMode === "light" ? "gray.500" : "gray.300"
															}
														>
															no vote
														</Text>
													</Box>
												) : !room.isRevealed ? (
													<Box
														p={2}
														bg={
															colorMode === "light" ? "green.100" : "green.700"
														}
														color={
															colorMode === "light" ? "green.800" : "white"
														}
														borderRadius="md"
														textAlign="center"
														minWidth="80px"
														display="flex"
														justifyContent="center"
														alignItems="center"
														height="40px"
													>
														<Text fontWeight="bold">✓</Text>
													</Box>
												) : (
													<Box
														p={2}
														bg={colorMode === "light" ? "blue.100" : "blue.700"}
														color={colorMode === "light" ? "blue.800" : "white"}
														borderRadius="md"
														textAlign="center"
														minWidth="80px"
														display="flex"
														justifyContent="center"
														alignItems="center"
														height="40px"
													>
														<Text fontWeight="bold">
															{
																room.votes.find(
																	(vote) => vote.userId === participant.id
																)?.value
															}
														</Text>
													</Box>
												)}
											</Flex>
										</Grid>
									))}

								{room.isRevealed && room.votes.length > 0 && (
									<>
										<hr />
										<Grid
											templateColumns="1fr 120px"
											gap={2}
											p={2}
											borderRadius="md"
										>
											<Flex align="center">
												<Text fontWeight="bold">Average</Text>
											</Flex>
											<Flex justify="center" align="center" minHeight="40px">
												<Box
													p={2}
													bg={colorMode === "light" ? "blue.900" : "gray.100"}
													color={colorMode === "light" ? "white" : "black"}
													borderRadius="md"
													textAlign="center"
													minWidth="80px"
													display="flex"
													justifyContent="center"
													alignItems="center"
													height="40px"
												>
													<Text fontWeight="bold">{calculateAverage()}</Text>
												</Box>
											</Flex>
										</Grid>
									</>
								)}
							</VStack>
						</Box>

						{/* Spectators section - 30% width on medium screens and above */}
						<Box
							p={4}
							bg={colorMode === "light" ? "gray.50" : "gray.700"}
							borderRadius="md"
							borderWidth="1px"
							borderColor={colorMode === "light" ? "gray.200" : "gray.600"}
							width={{ base: "100%", md: "30%" }}
						>
							<Grid templateColumns="1fr" gap={2} mb={3} px={2}>
								<Text fontWeight="bold">Spectators</Text>
							</Grid>
							<VStack spacing={2} align="stretch">
								{room.users
									.filter((spectator) => spectator.isSpectator)
									.sort((a, b) => a.name.localeCompare(b.name))
									.map((spectator) => (
										<Grid
											key={spectator.id}
											templateColumns="1fr"
											gap={2}
											p={2}
											borderRadius="md"
										>
											<Flex align="center">
												<Text
													fontWeight={
														spectator.id === user.id ? "bold" : "normal"
													}
													color={
														colorMode === "light" ? "gray.600" : "gray.300"
													}
												>
													{spectator.name} {spectator.id === user.id && "(you)"}
												</Text>
											</Flex>
										</Grid>
									))}
								{room.users.filter((u) => u.isSpectator).length === 0 && (
									<Text
										fontSize="sm"
										color={colorMode === "light" ? "gray.500" : "gray.400"}
										p={2}
									>
										No spectators at the moment.
									</Text>
								)}
							</VStack>
						</Box>
					</Flex>

					<HStack>
						<Button
							colorScheme="green"
							onClick={revealVotes}
							isDisabled={room.votes.length === 0 || room.isRevealed}
							leftIcon={<ViewIcon />}
							shadow="md"
						>
							Reveal Votes
						</Button>
						<Button
							colorScheme="red"
							onClick={resetVotes}
							isDisabled={room.votes.length === 0}
							shadow="md"
							leftIcon={<RepeatIcon />}
						>
							Reset Votes
						</Button>
					</HStack>
				</VStack>
			</Box>

			<Box w={{ base: "90%", md: "60%" }} mx="auto" mt={8} borderRadius="lg">
				<HStack justify="space-between" w="100%">
					<HStack>
						<Button
							size="xs"
							leftIcon={<CopyIcon />}
							onClick={() => {
								// Create a share text with the room ID that users can manually enter
								navigator.clipboard.writeText(`${room.id}`);
								toast({
									title: "Share info copied",
									description: "Room ID has been copied to clipboard",
									status: "success",
									duration: 2000,
									isClosable: true,
								});
							}}
							shadow="md"
						>
							Copy Room ID
						</Button>
					</HStack>
					<Text fontSize="sm">Date: {new Date().toLocaleDateString()}</Text>
				</HStack>
			</Box>
		</>
	);
};
