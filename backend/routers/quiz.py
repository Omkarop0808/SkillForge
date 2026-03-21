import json
import asyncio
import random
import string
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List, Any
from pydantic import BaseModel
from google import genai
from config import settings

router = APIRouter()
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# --- 1. WebSocket Connection Manager for Multiplayer State ---
class RoomState:
    def __init__(self, host_id: str):
        self.host_id = host_id
        self.players: Dict[str, dict] = {} # client_id -> { name, score, isReady, finished }
        self.questions: List[dict] = []
        self.status = "waiting" # waiting, playing, results
        self.status = "waiting" # waiting, playing, results
        self.connections: Dict[str, WebSocket] = {}

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, RoomState] = {}

    async def connect(self, ws: WebSocket, room_code: str, client_id: str, player_name: str):
        await ws.accept()
        if room_code not in self.active_rooms:
            # First person to join becomes host
            self.active_rooms[room_code] = RoomState(host_id=client_id)
        
        room = self.active_rooms[room_code]
        room.connections[client_id] = ws
        room.players[client_id] = {
            "name": player_name,
            "score": 0,
            "finished": False,
            "answers": [] # list of dicts: { q_index, selected_option, is_correct, time_taken }
        }
        await self.broadcast_room_state(room_code)

    def disconnect(self, room_code: str, client_id: str):
        if room_code in self.active_rooms:
            room = self.active_rooms[room_code]
            if client_id in room.connections:
                del room.connections[client_id]
            if client_id in room.players:
                del room.players[client_id]
            # If room is empty, delete it
            if len(room.connections) == 0:
                del self.active_rooms[room_code]
            else:
                # If host left, reassign host randomly
                if room.host_id == client_id:
                    room.host_id = list(room.players.keys())[0]

    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_rooms:
            dead_connections = []
            for cid, connection in self.active_rooms[room_code].connections.items():
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(cid)
            for cid in dead_connections:
                self.disconnect(room_code, cid)

    async def broadcast_room_state(self, room_code: str):
        if room_code not in self.active_rooms: return
        room = self.active_rooms[room_code]
        state = {
            "type": "room_state",
            "host_id": room.host_id,
            "status": room.status,
            "players": room.players,
            "total_questions": len(room.questions)
        }
        await self.broadcast(room_code, state)

manager = ConnectionManager()


# --- 2. WebSocket Endpoint ---
@router.websocket("/ws/quiz/{room_code}/{client_id}/{player_name}")
async def quiz_websocket(websocket: WebSocket, room_code: str, client_id: str, player_name: str):
    await manager.connect(websocket, room_code.upper(), client_id, player_name)
    try:
        while True:
            data = await websocket.receive_json()
            room = manager.active_rooms.get(room_code.upper())
            if not room: break
            
            action = data.get("action")
            
            if action == "start_game" and client_id == room.host_id:
                # Host clicked start game! (Questions must be provided)
                questions = data.get("questions", [])
                if questions:
                    room.questions = questions
                    room.status = "playing"
                    
                    # Reset player finish states
                    for p in room.players.values():
                        p["finished"] = False
                        p["score"] = 0
                        p["answers"] = []
                    
                    # Broadcast FULL question array so players can progress independently
                    await manager.broadcast(room_code.upper(), {
                        "type": "game_started",
                        "questions": room.questions
                    })
                    await manager.broadcast_room_state(room_code.upper())
                    
            elif action == "submit_answer":
                q_index = data.get("question_index")
                selected_option = data.get("selected_option")
                time_taken = data.get("time_taken", 30)
                
                # Score safely calculating independent index
                if 0 <= q_index < len(room.questions):
                    correct_option = room.questions[q_index]["correct_option"]
                    is_correct = (selected_option == correct_option)
                    
                    points = 0
                    if is_correct:
                        speed_bonus = max(0, int((30 - time_taken) / 30 * 500))
                        points = 500 + speed_bonus
                        
                    room.players[client_id]["score"] += points
                    room.players[client_id]["answers"].append({
                        "q_index": q_index,
                        "selected": selected_option,
                        "correct": is_correct,
                        "points": points
                    })
                    
                    # Broadcast live scoreboard updates silently
                    await manager.broadcast_room_state(room_code.upper())
            
            elif action == "player_finished":
                room.players[client_id]["finished"] = True
                await manager.broadcast_room_state(room_code.upper())
                
                # Check if ALL players are finished
                if all(p.get("finished", False) for p in room.players.values()):
                    room.status = "results"
                    await manager.broadcast(room_code.upper(), {
                        "type": "game_over",
                        "final_leaderboard": room.players
                    })

    except WebSocketDisconnect:
        manager.disconnect(room_code.upper(), client_id)
        # Notify remaining players
        await manager.broadcast_room_state(room_code.upper())
        

# --- 3. REST Endpoints for Setup ---
class QuizRequest(BaseModel):
    topic: str
    num_questions: int
    context: str = "" # Optional base text from "My Notes"

@router.post("/generate")
async def generate_quiz(req: QuizRequest):
    """Generates an array of JSON questions using Gemini."""
    try:
        context_instruction = f'Base the questions STRICTLY on this provided context/notes:\n{req.context}' if req.context else 'Ensure the questions range from foundational to intermediate difficulty.'
        
        prompt = f"""
        You are an expert technical Quiz Master. Generate a {req.num_questions}-question multiple choice quiz on the topic: "{req.topic}".
        
        {context_instruction}
        
        JSON SCHEMA REQUIRED:
        [
          {{
            "question": "The question text",
            "options": ["A", "B", "C", "D"], // Exactly 4 options
            "correct_option": "A", // Must exactly match one of the string elements in 'options' array
            "explanation": "Brief explanation of why this is correct."
          }}
        ]
        
        Return ONLY valid JSON matching this exact structure. Do not use markdown wrappers.
        """
        
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        
        result_text = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            questions = json.loads(result_text)
            # Validation
            for q in questions:
                if q["correct_option"] not in q["options"]:
                    q["correct_option"] = q["options"][0] # Failsafe
            return {"questions": questions}
        except Exception as e:
            print("Gemini JSON Parse Error:", result_text)
            raise HTTPException(status_code=500, detail="Failed to parse AI quiz response.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/create-room")
async def create_room():
    """Generates a unique 6-character room code."""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in manager.active_rooms:
            return {"room_code": code}
