import {
	ChakraProvider,
	ThemeConfig,
	extendTheme,
	ColorModeScript,
} from "@chakra-ui/react";
import { RoomProvider } from "./context/RoomContext";
import { Home } from "./components/Home";
import { Room } from "./components/Room";
import { useRoom } from "./context/RoomContext";

const config: ThemeConfig = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const theme = extendTheme({ config });

function App() {
	return (
		<>
			<ColorModeScript initialColorMode={theme.config.initialColorMode} />
			<ChakraProvider theme={theme}>
				<RoomProvider>
					<AppContent />
				</RoomProvider>
			</ChakraProvider>
		</>
	);
}

const AppContent = () => {
	const { room } = useRoom();
	return room ? <Room /> : <Home />;
};

export default App;
