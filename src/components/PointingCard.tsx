import React from "react";
import { Box, Text, useColorMode } from "@chakra-ui/react";
import { PointValue } from "../types";

interface PointingCardProps {
	value: PointValue;
	isSelected?: boolean;
	onClick?: () => void;
	isRevealed?: boolean;
	isDisabled?: boolean;
}

export const PointingCard: React.FC<PointingCardProps> = ({
	value,
	isSelected = false,
	onClick,
	isRevealed = false,
	isDisabled = false,
}) => {
	const { colorMode } = useColorMode();
	const isDark = colorMode === "dark";

	return (
		<Box
			as="button"
			w={{ base: "55px", md: "60px" }}
			h={{ base: "85px", md: "90px" }}
			maxW="80px"
			bg={
				isSelected
					? isDark
						? "blue.600"
						: "blue.500"
					: isDark
					? "gray.700"
					: "white"
			}
			color={
				isSelected
					? "white"
					: isDisabled
					? isDark
						? "gray.500"
						: "gray.400"
					: isDark
					? "white"
					: "black"
			}
			border="2px solid"
			borderColor={
				isSelected
					? isDark
						? "blue.400"
						: "blue.500"
					: isDisabled
					? isDark
						? "gray.600"
						: "gray.200"
					: isDark
					? "gray.600"
					: "gray.200"
			}
			borderRadius="lg"
			boxShadow={
				isSelected
					? isDark
						? "0 0 15px rgba(66, 153, 225, 0.5)"
						: "0 0 10px rgba(66, 153, 225, 0.4)"
					: isDark
					? "dark-lg"
					: "md"
			}
			display="flex"
			alignItems="center"
			justifyContent="center"
			cursor={isDisabled ? "not-allowed" : onClick ? "pointer" : "default"}
			transition="all 0.3s ease"
			position="relative"
			transform={`${isRevealed ? "rotateY(0deg)" : "rotateY(0deg)"} ${
				isSelected ? "translateY(-4px)" : ""
			}`}
			opacity={isDisabled ? 0.6 : 1}
			_hover={
				!isDisabled && onClick
					? {
							transform: "scale(1.08) translateY(-5px)",
							boxShadow: isDark
								? "0 0 18px rgba(66, 153, 225, 0.6)"
								: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
							borderColor: isDark ? "blue.400" : "blue.300",
							zIndex: 10
					  }
					: undefined
			}
			_active={
				!isDisabled && onClick
					? {
							transform: "scale(0.98) translateY(-2px)",
							boxShadow: isDark ? "0 0 10px rgba(66, 153, 225, 0.4)" : "sm",
					  }
					: undefined
			}
			onClick={isDisabled ? undefined : onClick}
			fontFamily="'Montserrat', sans-serif"
		>
			<Box
				position="absolute"
				top="5px"
				left="5px"
				fontSize="xs"
				fontWeight="normal"
				opacity="0.7"
			>
				{value}
			</Box>
			<Text fontSize="2xl" fontWeight="bold" letterSpacing="tight">
				{value}
			</Text>
			<Box
				position="absolute"
				bottom="5px"
				right="5px"
				fontSize="xs"
				fontWeight="normal"
				opacity="0.7"
				transform="rotate(180deg)"
			>
				{value}
			</Box>
		</Box>
	);
};
