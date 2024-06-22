import asyncio
import websockets
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

clients = {
    'sender': None,
    'receivers': set()
}


async def handler(websocket, path):
    try:
        role = await websocket.recv()
        if role == 'sender':
            clients['sender'] = websocket
            logging.info(f'Sender connected: {websocket.remote_address}')
            try:
                async for message in websocket:
                    # Broadcast the received frame to all receiver clients
                    for client in clients['receivers']:
                        if client.open:
                            await client.send(message)
                            logging.info(f'Frame sent to client: {
                                         client.remote_address}')
            finally:
                clients['sender'] = None
                logging.info(f'Sender disconnected: {
                             websocket.remote_address}')
        elif role == 'receiver':
            clients['receivers'].add(websocket)
            logging.info(f'Receiver connected: {websocket.remote_address}')
            try:
                await websocket.wait_closed()
            finally:
                clients['receivers'].remove(websocket)
                logging.info(f'Receiver disconnected: {
                             websocket.remote_address}')
    except websockets.ConnectionClosed as e:
        logging.warning(f'Connection closed: {e}')

start_server = websockets.serve(handler, "localhost", 8765)

logging.info("WebSocket server started on ws://localhost:8765")

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
