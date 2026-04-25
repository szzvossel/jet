import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Channel,
  ClientMessage,
  MarketEvent,
  ServerMessage,
} from "../types";

const RING_BUFFER_SIZE = 500;
const RECONNECT_DELAY_MS = 3000;

interface UseMarketEventsOptions {
  url?: string;
  initialChannels?: Channel[];
  autoReconnect?: boolean;
}

interface UseMarketEventsResult {
  events: MarketEvent[];
  latestEvent: MarketEvent | null;
  connectionState: number; // WebSocket readyState (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
  subscribe: (channels: Channel[]) => void;
  unsubscribe: (channels: Channel[]) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useMarketEvents(
  options?: UseMarketEventsOptions
): UseMarketEventsResult {
  const url =
    options?.url ??
    "ws://localhost:3001/ws";
  const autoReconnect = options?.autoReconnect ?? true;
  const initialChannelsRef = useRef(options?.initialChannels ?? []);

  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<MarketEvent | null>(null);
  const [connectionState, setConnectionState] = useState<number>(
    WebSocket.CLOSED
  );
  const wsRef = useRef<WebSocket | null>(null);
  const ringRef = useRef<MarketEvent[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const stoppedRef = useRef(false); // user manually stopped

  const clearReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeWs = useCallback(() => {
    clearReconnect();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnect]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback(
    (channels: Channel[]) => {
      send({ action: "subscribe", channels });
    },
    [send]
  );

  const unsubscribe = useCallback(
    (channels: Channel[]) => {
      send({ action: "unsubscribe", channels });
    },
    [send]
  );

  // Internal connect function — creates a WebSocket, sets up handlers.
  const doConnect = useCallback(() => {
    if (cancelledRef.current || stoppedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelledRef.current || stoppedRef.current) {
        ws.close();
        return;
      }
      setConnectionState(ws.readyState);

      const channels = initialChannelsRef.current;
      if (channels.length > 0) {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            channels,
          })
        );
      }
    };

    ws.onmessage = (ev) => {
      if (cancelledRef.current) return;
      try {
        const msg: ServerMessage = JSON.parse(ev.data as string);

        if (msg.type === "event") {
          const event = msg.event;
          ringRef.current.push(event);
          if (ringRef.current.length > RING_BUFFER_SIZE) {
            ringRef.current = ringRef.current.slice(-RING_BUFFER_SIZE);
          }
          setEvents([...ringRef.current]);
          setLatestEvent(event);
        }
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onclose = () => {
      if (cancelledRef.current) return;
      setConnectionState(WebSocket.CLOSED);

      if (!stoppedRef.current && autoReconnect) {
        reconnectTimerRef.current = setTimeout(doConnect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror.
    };

    setConnectionState(ws.readyState);
  }, [url, autoReconnect]);

  // Public connect — start the connection.
  const connect = useCallback(() => {
    stoppedRef.current = false;
    doConnect();
  }, [doConnect]);

  // Public disconnect — stop and prevent auto-reconnect.
  const disconnect = useCallback(() => {
    stoppedRef.current = true;
    closeWs();
    setConnectionState(WebSocket.CLOSED);
  }, [closeWs]);

  // Cleanup on unmount.
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      closeWs();
    };
  }, [closeWs]);

  return { events, latestEvent, connectionState, subscribe, unsubscribe, connect, disconnect };
}
