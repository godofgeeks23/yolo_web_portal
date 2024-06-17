import asyncio
import websockets
import cv2


async def send_frames(websocket, path):
    # video_capture = cv2.VideoCapture(0)  # Open the default camera
    video_capture = cv2.VideoCapture('video.mp4')  # Open a video file

    while True:
        ret, frame = video_capture.read()
        if not ret:
            break
        _, buffer = cv2.imencode('.jpg', frame)
        await websocket.send(buffer.tobytes())

    video_capture.release()

start_server = websockets.serve(send_frames, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
