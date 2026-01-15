import requests
import json
import asyncio
import websockets
from typing import Optional, Dict, Any, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPClient:
    def __init__(self, server_url: str, use_websocket: bool = False):
        self.server_url = server_url
        self.use_websocket = use_websocket
        self.websocket = None
        self.session_id = None
        
    async def connect(self) -> bool:
        """MCP 서버에 연결"""
        try:
            if self.use_websocket:
                ws_url = self.server_url.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws'
                self.websocket = await websockets.connect(ws_url)
                
                # 초기화 메시지 전송
                init_message = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "clientInfo": {
                            "name": "okmcp-client",
                            "version": "1.0.0"
                        }
                    }
                }
                
                await self.websocket.send(json.dumps(init_message))
                response = await self.websocket.recv()
                result = json.loads(response)
                
                if result.get("result"):
                    self.session_id = result["result"].get("session_id")
                    logger.info(f"MCP 서버에 연결됨 (세션 ID: {self.session_id})")
                    return True
                else:
                    logger.error(f"연결 실패: {result.get('error', '알 수 없는 오류')}")
                    return False
            else:
                # HTTP 연결 확인
                response = requests.get(f"{self.server_url}/health", timeout=5)
                if response.status_code == 200:
                    logger.info(f"MCP 서버에 연결됨: {self.server_url}")
                    return True
                else:
                    logger.error(f"서버 상태 확인 실패: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"연결 오류: {e}")
            return False
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """사용 가능한 도구 목록 조회"""
        try:
            if self.use_websocket and self.websocket:
                message = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/list",
                    "params": {}
                }
                
                await self.websocket.send(json.dumps(message))
                response = await self.websocket.recv()
                result = json.loads(response)
                
                return result.get("result", {}).get("tools", [])
            else:
                response = requests.get(f"{self.server_url}/tools")
                if response.status_code == 200:
                    return response.json().get("tools", [])
                else:
                    raise Exception(f"도구 목록 조회 실패: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"도구 목록 조회 오류: {e}")
            return []
    
    async def call_tool(self, tool_name: str, method: str, params: List[Any]) -> Any:
        """도구 호출"""
        try:
            if self.use_websocket and self.websocket:
                message = {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": {
                            "method": method,
                            "params": params
                        }
                    }
                }
                
                await self.websocket.send(json.dumps(message))
                response = await self.websocket.recv()
                result = json.loads(response)
                
                if "result" in result:
                    return result["result"]
                else:
                    raise Exception(result.get("error", "알 수 없는 오류"))
            else:
                payload = {
                    "tool": tool_name,
                    "method": method,
                    "params": params
                }
                
                response = requests.post(
                    f"{self.server_url}/mcp", 
                    json=payload,
                    timeout=10
                )
                
                if response.status_code == 200:
                    return response.json()["result"]
                else:
                    error = response.json().get("error", "알 수 없는 오류")
                    raise Exception(f"MCP 호출 실패: {error}")
                    
        except Exception as e:
            logger.error(f"도구 호출 오류: {e}")
            raise
    
    async def disconnect(self):
        """연결 종료"""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            logger.info("MCP 서버 연결 종료")

# 사용 예시
client = MCPClient("http://localhost:3000")
result = client.call_tool("calculator", "add", [5, 3000])
print(f"5 + 3 = {result}")

weather = client.call_tool("weather", "getTemperature", ["서울"])
print(weather)
