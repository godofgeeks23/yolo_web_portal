import asyncio
import websockets
import cv2
import numpy as np

async def receive_frames():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        while True:
            frame_bytes = await websocket.recv()
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            cv2.imshow('Video', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()

asyncio.get_event_loop().run_until_complete(receive_frames())
