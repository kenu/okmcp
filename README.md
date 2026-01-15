# OKMCP - Simple MCP Example

MCP (Model Context Protocol) 표준을 따르는 간단한 서버-클라이언트 예제 프로젝트입니다.

## 구조

- **server**: Node.js MCP 서버 (HTTP + WebSocket 지원)
- **client**: Python MCP 클라이언트 (HTTP + WebSocket 지원)

## 특징

- ✅ MCP 표준 프로토콜 지원 (JSON-RPC 2.0)
- ✅ HTTP 및 WebSocket 통신 지원
- ✅ 자동 연결 관리 및 재연결
- ✅ 도구 목록 조회 기능
- ✅ 세션 관리
- ✅ 상세한 로깅

## 시작하기

### 서버 실행

```bash
cd server
npm install
npm start
```

서버가 다음 주소에서 실행됩니다:
- HTTP: http://localhost:3000
- WebSocket: ws://localhost:3000/ws

### 클라이언트 실행

```bash
cd client
pip install -e .
python main.py
```

## API 엔드포인트

### HTTP 엔드포인트

- `GET /health` - 서버 상태 확인
- `GET /tools` - 사용 가능한 도구 목록
- `POST /mcp` - 기존 MCP 엔드포인트 (하위 호환성)
- `POST /mcp/v2` - 새로운 MCP 표준 엔드포인트

### WebSocket

- `ws://localhost:3000/ws` - WebSocket 연결

## 사용 예시

### HTTP 클라이언트

```python
import asyncio
from main import MCPClient

async def main():
    client = MCPClient("http://localhost:3000", use_websocket=False)
    
    if await client.connect():
        # 도구 목록 조회
        tools = await client.list_tools()
        print(f"사용 가능한 도구: {len(tools)}개")
        
        # 계산기 사용
        result = await client.call_tool("calculator", "add", [5, 3])
        print(f"5 + 3 = {result}")
        
        # 날씨 정보 조회
        weather = await client.call_tool("weather", "getTemperature", ["서울"])
        print(weather)
    
    await client.disconnect()

asyncio.run(main())
```

### WebSocket 클라이언트

```python
import asyncio
from main import MCPClient

async def main():
    client = MCPClient("http://localhost:3000", use_websocket=True)
    
    if await client.connect():
        # MCP 표준 프로토콜로 통신
        tools = await client.list_tools()
        result = await client.call_tool("calculator", "multiply", [4, 7])
        print(f"4 × 7 = {result}")
    
    await client.disconnect()

asyncio.run(main())
```

## MCP 메시지 형식

### 초기화

```json
{
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
```

### 도구 호출

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "method": "add",
      "params": [5, 3]
    }
  }
}
```

## 사용 가능한 도구

### Calculator
- `add(a, b)` - 덧셈
- `subtract(a, b)` - 뺄셈
- `multiply(a, b)` - 곱셈
- `divide(a, b)` - 나눗셈

### Weather
- `getTemperature(city)` - 도시 온도 조회

## 개발

### 서버 개발

```bash
cd server
npm install
npm run dev
```

### 클라이언트 개발

```bash
cd client
pip install -e .
python main.py
```

## 라이선스

ISC
