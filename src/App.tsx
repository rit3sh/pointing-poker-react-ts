import { ChakraProvider, ThemeConfig } from '@chakra-ui/react';
import { RoomProvider } from './context/RoomContext';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { useRoom } from './context/RoomContext';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

function App() {
  return (
    <ChakraProvider resetCSS>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </ChakraProvider>
  );
}

const AppContent = () => {
  const { room } = useRoom();
  return room ? <Room /> : <Home />;
};

export default App;
