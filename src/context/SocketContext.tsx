import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "../store"; // Update the path to your store

const SOCKET_URL = 'https://prod.aaravpos.com'

interface JoinStaffPayload {
  staffId: string | number;
  roomId: string | number;
  room: string | number;
  id: string | number;
}

interface SocketContextType {
  socket: Socket;
  connectSocket: (payload: JoinStaffPayload) => void;
}

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
}) => {
  const { selectedProfessional } = useSelector(
    (state: RootState) => state.booking.service,
  );

  const [socket] = useState<Socket>(() =>
    io(SOCKET_URL as string, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    })
  );

  const connectSocket = (payload: JoinStaffPayload): void => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.off("connect");

    socket.on("connect", () => {
      socket.emit("joinStaff", payload);
    });
  };

  useEffect(() => {
    if (!selectedProfessional?.id) return;

    const payload: JoinStaffPayload = {
      staffId: selectedProfessional.id,
      roomId: selectedProfessional.id,
      room: selectedProfessional.id,
      id: selectedProfessional.id,
    };

    connectSocket(payload);
  }, [selectedProfessional?.id]);

  return (
    <SocketContext.Provider value={{ socket, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
};