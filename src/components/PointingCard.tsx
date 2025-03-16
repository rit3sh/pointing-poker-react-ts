import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { PointValue } from '../types';

interface PointingCardProps {
  value: PointValue;
  isSelected?: boolean;
  onClick?: () => void;
  isRevealed?: boolean;
}

export const PointingCard: React.FC<PointingCardProps> = ({
  value,
  isSelected = false,
  onClick,
  isRevealed = false,
}) => {
  return (
    <Box
      as="button"
      w="60px"
      h="90px"
      bg={isSelected ? 'blue.500' : 'white'}
      color={isSelected ? 'white' : 'black'}
      border="2px solid"
      borderColor={isSelected ? 'blue.500' : 'gray.200'}
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.2s"
      transform={isRevealed ? 'rotateY(0deg)' : 'rotateY(0deg)'}
      _hover={onClick ? {
        transform: 'scale(1.05)',
        boxShadow: 'lg',
      } : undefined}
      onClick={onClick}
    >
      <Text fontSize="xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}; 